package io.ionic.starter;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

import ai.soliman.plugins.messagereader.MessageReaderPlugin;
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Use the Class name you found in the folder
        registerPlugin(MessageReaderPlugin.class);
    }
}
