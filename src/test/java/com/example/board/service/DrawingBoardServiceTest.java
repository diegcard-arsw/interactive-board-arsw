package com.example.board.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

import com.example.board.model.DrawingAction;

public class DrawingBoardServiceTest {

    @Test
    void testAddAndClear() {
        DrawingBoardService svc = new DrawingBoardService();
        svc.addAction(new DrawingAction(10, 20, "#ff0000", false));
        svc.addAction(new DrawingAction(30, 40, "#00ff00", false));
        assertEquals(2, svc.getActions().size());
        svc.clear();
        assertTrue(svc.getActions().isEmpty());
    }

    @Test
    void testClearActionFlag() {
        DrawingBoardService svc = new DrawingBoardService();
        svc.addAction(new DrawingAction(10, 20, "#ff0000", false));
        svc.addAction(new DrawingAction(0, 0, "#000000", true)); // clear flag
        assertTrue(svc.getActions().isEmpty(), "Debe limpiar al recibir clear=true");
    }
}
