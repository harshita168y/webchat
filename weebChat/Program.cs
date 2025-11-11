using DotNetEnv;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using weebChat.Data;
using weebChat.Hubs;
using weebChat.Services;



var builder = WebApplication.CreateBuilder(args);

var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
if (File.Exists(envPath))
{
    Env.Load(envPath);
    Console.WriteLine($"✅ .env loaded from {envPath}");
}
else
{
    Console.WriteLine("⚠️ .env file not found, environment variables may be missing.");
}

builder.Configuration.AddEnvironmentVariables();
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste your Firebase ID token (no 'Bearer' prefix)."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
    .EnableDetailedErrors()
           .EnableSensitiveDataLogging()
           .LogTo(Console.WriteLine, LogLevel.Information)
           );


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:8081",
                 "http://10.0.2.2:8081",    // Android emulator (optional)
                "http://127.0.0.1:8081",
                "http://localhost:19006",   // Expo dev
                "http://localhost:5173",    // Vite dev (if any)
                "http://127.0.0.1:5500"     // local file:// testing from VSCode Live Server
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var firebaseProjectId = Environment.GetEnvironmentVariable("FIREBASE_PROJECT_ID");
if (string.IsNullOrWhiteSpace(firebaseProjectId))
    Console.WriteLine("❌ FIREBASE_PROJECT_ID not found in environment variables!");
else
    Console.WriteLine($"✅ Firebase Project ID Loaded: {firebaseProjectId}");

FirebaseApp.Create(new AppOptions()
{
    Credential = GoogleCredential.FromFile("Data/firebase-key.json")
});

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = $"https://securetoken.google.com/{firebaseProjectId}";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = $"https://securetoken.google.com/{firebaseProjectId}",
            ValidateAudience = true,
            ValidAudience = firebaseProjectId,
            ValidateLifetime = true,
            IssuerSigningKeyResolver = (token, securityToken, kid, validationParameters) =>
            {
                var keysUrl = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
                using var http = new HttpClient();
                var json = http.GetStringAsync(keysUrl).Result;
                var certs = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(json);
                var keyList = new List<SecurityKey>();
                foreach (var cert in certs.Values)
                {
                    var x509 = new X509Certificate2(Encoding.UTF8.GetBytes(cert));
                    keyList.Add(new X509SecurityKey(x509));
                }
                return keyList;
            }
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // ✅ Allow SignalR to read token from query string
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/chat"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                var claimsIdentity = context.Principal?.Identity as ClaimsIdentity;
                var uid = claimsIdentity?.FindFirst("user_id")?.Value;
                Console.WriteLine($"✅ Firebase verified token UID: {uid}");
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine("❌ JWT validation failed: " + context.Exception.Message);
                return Task.CompletedTask;
            }
        };
    });


var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.AllowAnyOrigin()
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});

builder.Services.AddAuthorization();
// DI
builder.Services.AddHttpClient();
builder.Services.AddSingleton<ContextService>();
builder.Services.AddScoped<weebChat.Services.IModerationService, weebChat.Services.ModerationService>();


// Build app
var app = builder.Build();

var cs = builder.Configuration.GetConnectionString("DefaultConnection");
Console.WriteLine($"[DB] Using connection: {cs}");


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseCors("AllowMobile");

//app.UseCors("AllowAll");
app.UseHttpsRedirection();

app.UseCors("AllowFrontend");
app.UseCors(MyAllowSpecificOrigins);


app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");
app.Run();

