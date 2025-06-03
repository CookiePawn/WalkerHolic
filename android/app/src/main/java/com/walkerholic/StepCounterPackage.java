package com.walkerholic;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class StepCounterPackage implements ReactPackage {
    private StepCounterService stepCounterService;

    public void setStepCounterService(StepCounterService service) {
        this.stepCounterService = service;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        StepCounterModule module = new StepCounterModule(reactContext);
        if (stepCounterService != null) {
            module.setStepCounterService(stepCounterService);
        }
        modules.add(module);
        return modules;
    }
} 