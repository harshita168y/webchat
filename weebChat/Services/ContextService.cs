using System.Collections.Concurrent;

namespace weebChat.Services
{
    public class ContextService
    {
        // Dictionary<RoomId, List<Messages>>
        private readonly ConcurrentDictionary<string, List<string>> _roomContexts = new();

        private const int MaxContextMessages = 10; // adjust how many past messages to remember

        public void AddMessage(string roomId, string message)
        {
            var context = _roomContexts.GetOrAdd(roomId, new List<string>());
            context.Add(message);

            // keep only last 10 messages
            if (context.Count > MaxContextMessages)
                context.RemoveAt(0);
        }

        public string GetContextSnippet(string roomId)
        {
            if (_roomContexts.TryGetValue(roomId, out var messages))
                return string.Join("\n", messages);

            return string.Empty;
        }
    }
}
