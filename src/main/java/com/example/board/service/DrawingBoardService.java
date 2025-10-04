package com.example.board.service;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.stereotype.Service;

import com.example.board.model.DrawingAction;

@Service
public class DrawingBoardService {

    private final CopyOnWriteArrayList<DrawingAction> actions = new CopyOnWriteArrayList<>();

    public void addAction(DrawingAction action) {
        if (action.clear()) {
            actions.clear();
        } else {
            actions.add(action);
        }
    }

    public List<DrawingAction> getActions() {
        return List.copyOf(actions);
    }

    public void clear() {
        actions.clear();
    }
}
