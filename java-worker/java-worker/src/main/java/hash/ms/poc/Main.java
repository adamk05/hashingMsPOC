package hash.ms.poc;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import redis.clients.jedis.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Main {
    private static final Logger logger = LoggerFactory.getLogger(Main.class);


    public static void main(String[] args) {
        logger.info("Java application started");
        JedisPool jedisPool = new JedisPool(new JedisPoolConfig(), "redis", 6379);
        try (Jedis publisher = jedisPool.getResource(); Jedis subscriber = jedisPool.getResource()) {
            JedisPubSub pubSubListener = new JedisPubSub() {
                @Override
                public void onMessage(String channel, String message) {
                    JsonObject task = JsonParser.parseString(message).getAsJsonObject();
                    String id = task.get("id").getAsString();
                    String text = task.get("text").getAsString();
                    logger.info("Received task {} with text {}", id, text);
                    JsonObject response = new JsonObject();
                    response.addProperty("id", id);
                    response.addProperty("text", "HANDLED BY JAVA" + text);
                    try {
                        Thread.sleep(5000);
                    } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                    }
                    publisher.publish("result", response.toString());
                    logger.info("Zakończono zadanie {}", id);
                }
            };
            logger.info("Waiting for tasks on channel 'java'");
            subscriber.subscribe(pubSubListener, "java");
        } catch (Exception e) {
            logger.error(e.getMessage(), e);
        }
    }
}