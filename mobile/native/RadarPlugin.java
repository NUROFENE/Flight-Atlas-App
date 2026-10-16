package com.flightatlas.mobile;

import android.content.Intent;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Radar")
public class RadarPlugin extends Plugin {
    @PluginMethod
    public void open(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                Intent intent = new Intent(getActivity(), RadarActivity.class);
                getActivity().startActivity(intent);
                call.resolve();
            } catch (Exception error) {
                call.reject("Cannot open in-app VATSIM Radar", error);
            }
        });
    }
}
