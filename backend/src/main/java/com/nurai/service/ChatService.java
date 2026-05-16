package com.nurai.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final AiServiceClient aiServiceClient;

    public Map<String, Object> ask(String question, String language) {
        return aiServiceClient.askQuestion(question, language);
    }
}
