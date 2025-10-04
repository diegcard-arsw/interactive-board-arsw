package com.example.board.controller;

import com.example.board.model.DrawingAction;
import com.example.board.service.DrawingBoardService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class RealtimeDrawingController {

    private final DrawingBoardService service;

    public RealtimeDrawingController(DrawingBoardService service) {
        this.service = service;
    }

    @MessageMapping("draw")
    @SendTo("/topic/board")
    public DrawingAction handleDraw(DrawingAction action) {
        service.addAction(action);
        return action;
    }

    @MessageMapping("clear")
    @SendTo("/topic/clear")
    public String handleClear() {
        service.clear();
        return "CLEARED";
    }
}
