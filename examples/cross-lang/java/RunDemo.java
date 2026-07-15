import com.sun.net.httpserver.HttpServer;
import io.uniflow.sdk.UniFlowClient;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Minimal Java demo (default package for easy javac from repo root).
 *
 *   javac -d out sdk/java/src/main/java/io/uniflow/sdk/*.java examples/cross-lang/java/RunDemo.java
 *   java -cp out RunDemo
 */
public class RunDemo {
    public static void main(String[] args) throws Exception {
        String orch = env("UNIFLOW_URL", "http://127.0.0.1:8787");
        int greeterPort = Integer.parseInt(env("GREETER_PORT", "9101"));
        String greeterUrl = env("GREETER_URL", "http://127.0.0.1:" + greeterPort + "/execute");

        HttpServer greeter = null;
        if (!"1".equals(System.getenv("SKIP_LOCAL_GREETER"))) {
            greeter = startGreeter(greeterPort);
        }

        Path yaml = Path.of("examples/cross-lang/greeter.workflow.yaml");
        if (!Files.isRegularFile(yaml)) {
            yaml = Path.of("greeter.workflow.yaml");
        }

        UniFlowClient client = new UniFlowClient(orch);
        var v = client.validate(yaml.toString());
        v.raiseForStatus();
        System.out.println("validate ok: " + v.workflowId);

        String bindings = "{\"demo.greeter\":{\"type\":\"http\",\"endpoint\":\"" + greeterUrl + "\"}}";
        String reg = client.loadAndRegister(yaml.toString(), bindings);
        System.out.println("registered: " + reg);

        String run = client.startWorkflow("cross-lang-greeter", "{\"task\":\"java\"}", true);
        System.out.println("run: " + run);

        if (greeter != null) {
            greeter.stop(0);
        }
    }

    private static HttpServer startGreeter(int port) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
        server.createContext("/execute", exchange -> {
            byte[] body = exchange.getRequestBody().readAllBytes();
            String task = "world";
            String raw = new String(body, StandardCharsets.UTF_8);
            int idx = raw.indexOf("\"task\"");
            if (idx >= 0) {
                int colon = raw.indexOf(':', idx);
                int q1 = raw.indexOf('"', colon + 1);
                int q2 = raw.indexOf('"', q1 + 1);
                if (q1 >= 0 && q2 > q1) task = raw.substring(q1 + 1, q2);
            }
            byte[] resp = ("{\"content\":\"hello " + task + "\",\"toolCalls\":[],\"stopReason\":\"stop\",\"metadata\":{}}")
                    .getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, resp.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(resp);
            }
        });
        server.start();
        return server;
    }

    private static String env(String k, String d) {
        String v = System.getenv(k);
        return v == null || v.isBlank() ? d : v;
    }
}
