package com.example.board.controller;

import java.util.List;
import java.util.Map;
import java.util.Random;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.board.model.DrawingAction;
import com.example.board.service.DrawingBoardService;

@RestController
@RequestMapping("/api")
@CrossOrigin // Permite pruebas desde otros orígenes si abres el index con file://
public class DrawingController {

    private final DrawingBoardService boardService;
    private final Random random = new Random();

    public DrawingController(DrawingBoardService boardService) {
        this.boardService = boardService;
    }

    @PostMapping("/draw")
    public ResponseEntity<Void> draw(@RequestBody DrawingAction action) {
        boardService.addAction(action);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/board")
    public List<DrawingAction> board() {
        return boardService.getActions();
    }

    @PostMapping("/clear")
    public ResponseEntity<Void> clear() {
        boardService.clear();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/randomColor")
    public Map<String, String> randomColor() {
        String c = String.format("#%06X", random.nextInt(0xFFFFFF + 1));
        return Map.of("color", c);
    }
}
