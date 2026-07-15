package io.uniflow.sdk;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Optional;

/**
 * Uni-Flow Java SDK — HTTP client + YAML register helpers + LangChain4j Sidecar stubs.
 */
public class UniFlowClient {
    private final String baseUrl;
    private final HttpClient http;

    public UniFlowClient(String baseUrl) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    public WorkflowYaml.Result validate(String yamlOrPath) throws Exception {
        return WorkflowYaml.validate(yamlOrPath);
    }

    /**
     * Local structural validate then POST /workflows/from-yaml.
     *
     * @param yamlOrPath YAML string or file path
     * @param bindingsJson JSON object string, e.g. {"demo.greeter":{"type":"http","endpoint":"http://127.0.0.1:9101/execute"}}
     */
    public String loadAndRegister(String yamlOrPath, String bindingsJson) throws Exception {
        String text = yamlOrPath;
        if (yamlOrPath != null
                && !yamlOrPath.contains("\n")
                && !yamlOrPath.contains("\r")
                && !yamlOrPath.trim().startsWith("apiVersion:")) {
            try {
                Path p = Path.of(yamlOrPath);
                if (Files.isRegularFile(p)) {
                    text = Files.readString(p, StandardCharsets.UTF_8);
                }
            } catch (Exception ignored) {
                // inline YAML
            }
        }
        WorkflowYaml.Result v = WorkflowYaml.validate(text);
        v.raiseForStatus();
        String escaped = escapeJson(text);
        String bindings = bindingsJson == null || bindingsJson.isBlank() ? "{}" : bindingsJson;
        String body = "{\"yaml\":\"" + escaped + "\",\"bindings\":" + bindings + "}";
        return post("/workflows/from-yaml", body);
    }

    public String startWorkflow(String workflowId, String inputJson, boolean sync) throws Exception {
        String body = "{\"input\":" + (inputJson == null ? "{}" : inputJson) + ",\"sync\":" + sync + "}";
        return post("/workflows/" + encode(workflowId) + "/runs", body);
    }

    public String getRun(String workflowId, String runId) throws Exception {
        return get("/workflows/" + encode(workflowId) + "/runs/" + encode(runId));
    }

    public String resume(String workflowId, String runId, Optional<String> snapshotId) throws Exception {
        String body = snapshotId.map(s -> "{\"snapshotId\":\"" + s + "\"}").orElse("{}");
        return post("/workflows/" + encode(workflowId) + "/runs/" + encode(runId) + "/resume", body);
    }

    public String respondHitl(String workflowId, String runId, boolean approved, String responder) throws Exception {
        String body = "{\"approved\":" + approved + ",\"responder\":\"" + responder + "\"}";
        return post("/workflows/" + encode(workflowId) + "/runs/" + encode(runId) + "/hitl", body);
    }

    public String searchMemory(String query, int topK) throws Exception {
        return get("/memory/search?q=" + encode(query) + "&topK=" + topK);
    }

    private String get(String path) throws Exception {
        HttpRequest req = HttpRequest.newBuilder(URI.create(baseUrl + path))
                .timeout(Duration.ofSeconds(60))
                .GET()
                .build();
        try {
            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() >= 400) {
                throw new RuntimeException("Uni-Flow HTTP " + resp.statusCode() + ": " + resp.body());
            }
            return resp.body();
        } catch (java.net.ConnectException e) {
            throw new RuntimeException("Uni-Flow Orchestrator unreachable at " + baseUrl, e);
        }
    }

    private String post(String path, String body) throws Exception {
        HttpRequest req = HttpRequest.newBuilder(URI.create(baseUrl + path))
                .timeout(Duration.ofSeconds(120))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        try {
            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() >= 400) {
                throw new RuntimeException("Uni-Flow HTTP " + resp.statusCode() + ": " + resp.body());
            }
            return resp.body();
        } catch (java.net.ConnectException e) {
            throw new RuntimeException("Uni-Flow Orchestrator unreachable at " + baseUrl, e);
        }
    }

    private static String encode(String s) {
        return URI.create("http://x/" + s).getRawPath().substring(1);
    }

    private static String escapeJson(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", "\\r")
                .replace("\n", "\\n")
                .replace("\t", "\\t");
    }
}
