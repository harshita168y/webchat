using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace weebChat.Services
{
    public class ModerationResult
    {
        public bool IsFlagged { get; set; }
        public string? Category { get; set; }
        public double? Score { get; set; }
        public string? Reason { get; set; }

        public ModerationResult(bool flagged, string? category = null, double? score = null, string? reason = null)
        {
            IsFlagged = flagged;
            Category = category;
            Score = score;
            Reason = reason;
        }
    }

    public interface IModerationService
    {
        Task<ModerationResult> EvaluateAsync(string content, string senderId);
        Task<ModerationResult> EvaluateWithContextAsync(string content, string context, string senderId);
    }

    public class ModerationService : IModerationService
    {
        private static readonly JsonSerializerOptions _jsonOpts = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        private readonly IHttpClientFactory _httpFactory;
        private const double MODERATION_THRESHOLD = 0.65;

        private readonly List<string> _bannedWords = new()
        {
            "fuck","bitch","btch","asshole","slut",
            "nude","n00d","idiot"
        };

        public ModerationService(IHttpClientFactory httpFactory)
        {
            _httpFactory = httpFactory;
        }

        public async Task<ModerationResult> EvaluateAsync(string content, string senderId)
        {
            return await EvaluateWithContextAsync(content, string.Empty, senderId);
        }

        public async Task<ModerationResult> EvaluateWithContextAsync(string content, string context, string senderId)
        {
            if (string.IsNullOrWhiteSpace(content))
                return new ModerationResult(false, "empty", 0, "No content provided");

            bool isFictionalContext = DetectFictionalContext(context + " " + content);

            // 1️⃣ Local banned words (no skip here)
            var lower = content.ToLowerInvariant();
            var detected = _bannedWords.FirstOrDefault(w => lower.Contains(w));
            if (detected != null)
            {
                return new ModerationResult(true, "banned_word", 1.0, $"Detected banned term: {detected}");
            }

            // 2️⃣ Prepare for AI moderation
            string inputText = BuildModerationInput(content, context, isFictionalContext);
            var result = await CallOpenAIModerationAsync(inputText);

            // 3️⃣ Always block sexual content regardless of score or context
            if (result.Category?.Contains("sexual", StringComparison.OrdinalIgnoreCase) == true ||
                content.Contains("sex", StringComparison.OrdinalIgnoreCase))
            {
                Console.WriteLine($"🚫 Forced block — sexual content detected ({result.Category})");
                return new ModerationResult(true, "sexual", result.Score, "Explicit or sexual content not allowed");
            }

            // 4️⃣ Allow fictional violence/death
            if (isFictionalContext && result.IsFlagged &&
                (result.Category?.Contains("violence") == true || result.Category?.Contains("death") == true))
            {
                Console.WriteLine($"✅ Overriding AI moderation — fictional context detected ({result.Category}).");
                return new ModerationResult(false, "fictional_context", result.Score, "Allowed due to fictional story context");
            }

            // 5️⃣ Otherwise respect normal moderation threshold
            return result;
        }

        // Helper: detect if conversation seems fictional/anime
        private static bool DetectFictionalContext(string text)
        {
            var fictionHints = new[]
            {
                "anime","manga","episode","character","season","arc",
                "villain","hero","fight","battle","series","story","plot"
            };

            bool hasHint = fictionHints.Any(h => text.Contains(h, StringComparison.OrdinalIgnoreCase));
            var caps = System.Text.RegularExpressions.Regex.Matches(text, @"\b[A-Z][a-z]{3,}\b");
            return hasHint || caps.Count >= 2;
        }

        private static string BuildModerationInput(string content, string context, bool isFictional)
        {
            if (isFictional)
            {
                return
                    "The following conversation is about fictional anime or manga storylines. " +
                    "Mentions of killing, death, or violence are part of fictional discussions and not real threats.\n\n" +
                    $"Conversation so far:\n{context}\n---\nNew message:\n{content}";
            }
            else
            {
                return $"Conversation so far:\n{context}\n---\nNew message:\n{content}";
            }
        }

        private async Task<ModerationResult> CallOpenAIModerationAsync(string text)
        {
            var apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY");
            if (string.IsNullOrWhiteSpace(apiKey))
                return new ModerationResult(false, "config_error", 0, "OPENAI_API_KEY missing");

            try
            {
                var client = _httpFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(10);
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

                var payload = new ModerationRequest
                {
                    Model = "omni-moderation-latest",
                    Input = text
                };

                var json = JsonSerializer.Serialize(payload, _jsonOpts);
                using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/moderations")
                {
                    Content = new StringContent(json, Encoding.UTF8, "application/json")
                };

                using var resp = await client.SendAsync(req);
                if (!resp.IsSuccessStatusCode)
                {
                    var errTxt = await resp.Content.ReadAsStringAsync();
                    Console.WriteLine($"⚠️ Moderation HTTP {resp.StatusCode}: {errTxt}");
                    return new ModerationResult(false, "moderation_error", 0, $"HTTP {resp.StatusCode}");
                }

                var body = await resp.Content.ReadAsStringAsync();
                var data = JsonSerializer.Deserialize<ModerationResponse>(body, _jsonOpts);
                var result = data?.Results?.FirstOrDefault();

                if (result == null)
                    return new ModerationResult(false, "unknown", 0, "No moderation data");

                if (result.Flagged)
                {

                    var firstTrue = result.Categories
                        .Where(kv => kv.Value)
                        .Select(kv => kv.Key)
                        .FirstOrDefault() ?? "flagged";

                    double score = 1.0;
                    if (result.CategoryScores != null)
                    {
                        var candidates = result.CategoryScores
                            .Where(kv => result.Categories.TryGetValue(kv.Key, out var v) && v)
                            .Select(kv => kv.Value);
                        if (candidates.Any()) score = candidates.Max();
                    }

                    //if (score >= MODERATION_THRESHOLD)
                    //    return new ModerationResult(true, firstTrue, score, "Flagged by AI moderation");
                    if (score >= 0.85)
                        return new ModerationResult(true, firstTrue, score, "Severe violation");
                    else if (score >= 0.55)
                        return new ModerationResult(true, firstTrue, score, "Soft violation");

                    Console.WriteLine($"⚠️ Low-confidence moderation ({score:F2}) for '{firstTrue}' — allowing message.");
                    return new ModerationResult(false, firstTrue, score, "Below moderation threshold");
                }

                return new ModerationResult(false, "clean", 0, "Passed AI moderation");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Moderation API error: {ex.Message}");
                return new ModerationResult(false, "error", 0, "AI moderation failed");
            }
        }

        // DTOs
        private class ModerationRequest
        {
            [JsonPropertyName("model")]
            public string Model { get; set; } = "omni-moderation-latest";
            [JsonPropertyName("input")]
            public string Input { get; set; } = string.Empty;
        }

        private class ModerationResponse
        {
            [JsonPropertyName("results")] public List<ModerationItem>? Results { get; set; }
        }

        private class ModerationItem
        {
            [JsonPropertyName("flagged")] public bool Flagged { get; set; }
            [JsonPropertyName("categories")] public Dictionary<string, bool> Categories { get; set; } = new();
            [JsonPropertyName("category_scores")] public Dictionary<string, double>? CategoryScores { get; set; }
        }
    }
}

