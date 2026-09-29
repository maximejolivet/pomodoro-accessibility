package com.maximejolivet.pomodorotdah;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugins locaux à l'app : ils s'enregistrent avant que le bridge ne démarre.
        registerPlugin(WidgetBridgePlugin.class);
        registerPlugin(LiveStatusPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
