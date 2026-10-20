using StackExchange.Redis;
using System.Text.Json;

Console.WriteLine("Starting C# Worker");

ConnectionMultiplexer redis = ConnectionMultiplexer.Connect("redis:6379");
ISubscriber subscriber = redis.GetSubscriber();

subscriber.Subscribe("csharp", (channel, message) =>
{
    try
    {
        using JsonDocument doc = JsonDocument.Parse(message.ToString());
        JsonElement root = doc.RootElement;

        string id = root.GetProperty("id").GetString();
        string text = root.GetProperty("text").GetString();

        Console.WriteLine($"Odebrano zadanie [{id}], tekst: {text}");

        Thread.Sleep(400);

        var response = new
        {
            id = id,
            text = "HANDLED BY C#" + text
        };
        string jsonResponse = JsonSerializer.Serialize(response);

        subscriber.Publish("result", jsonResponse);
        Console.WriteLine($"Wysłano wynik dla zadania [{id}]");

    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error processing message: {ex.Message}");
    }
});


Thread.Sleep(Timeout.Infinite);