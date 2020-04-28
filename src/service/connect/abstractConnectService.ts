import { ConnectionNode } from "../../model/database/connectionNode";
import { DbTreeDataProvider } from "../../provider/treeDataProvider";
import { ViewManager } from "../../view/viewManager";
import { Node } from "../../model/interface/node";

export abstract class AbstractConnectService {

    protected abstract connect(connectionNode: Node): Promise<any> | any;

    public async openConnect(provider: DbTreeDataProvider, connectionNode?: ConnectionNode) {
        let node;
        if (connectionNode) {
            node = connectionNode.origin ? { ...connectionNode.origin, usingSSH: true, timezone: connectionNode.timezone, ssh: { ...connectionNode.ssh, tunnelPort: null } } : connectionNode
        }
        ViewManager.createWebviewPanel({
            path: "pages/connect/connect",
            title: "connect",
            splitView: false,
            initListener: (webviewPanel) => {
                if (node) {
                    webviewPanel.webview.postMessage({
                        type: "EDIT",
                        node
                    });
                }
            },
            receiveListener: async (webviewPanel, params) => {
                if (params.type === 'CONNECT_TO_SQL_SERVER') {
                    const connectNode = Node.build(params.connectionOption as Node)
                    try {
                        await this.connect(connectNode)
                        provider.addConnection(connectNode)
                        webviewPanel.dispose();
                    } catch (err) {
                        webviewPanel.webview.postMessage({
                            type: 'CONNECTION_ERROR',
                            err,
                        });
                    }
                }
            }
        });
    }

}