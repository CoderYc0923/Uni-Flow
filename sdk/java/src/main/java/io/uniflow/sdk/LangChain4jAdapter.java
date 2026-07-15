package io.uniflow.sdk;

import java.util.Map;
import java.util.function.Function;

/**
 * Unit Wrapper around an existing LangChain4j agent / AiServices proxy.
 * Invokes the delegate and maps the result to Uni-Flow AgentOutput shape (JSON).
 */
public class LangChain4jAdapter {
    private final Function<String, String> invoke;

    public LangChain4jAdapter(Function<String, String> invoke) {
        this.invoke = invoke;
    }

    public Map<String, Object> execute(String task) {
        String content = invoke.apply(task);
        return Map.of(
                "content", content == null ? "" : content,
                "toolCalls", java.util.List.of(),
                "stopReason", "stop",
                "metadata", Map.of("framework", "langchain4j")
        );
    }

    public Map<String, String> frameworkInfo() {
        return Map.of("name", "langchain4j", "version", "sidecar");
    }
}
