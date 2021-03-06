/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { DiagramManager } from "sprotty-theia/lib";
import { DiagramWidgetOptions } from "sprotty-theia/lib";
import { EditorPreferences } from "@theia/editor/lib/browser";
import { GLSPDiagramWidget } from "./glsp-diagram-widget";
import { GLSPTheiaSprottyConnector } from "./glsp-theia-sprotty-connector";
import { Widget } from "@phosphor/widgets";
import { WidgetOpenerOptions } from "@theia/core/lib/browser";

import { inject } from "inversify";
import { injectable } from "inversify";

import URI from "@theia/core/lib/common/uri";

@injectable()
export abstract class GLSPDiagramManager extends DiagramManager {
    @inject(EditorPreferences)
    protected readonly editorPreferences: EditorPreferences;
    abstract get fileExtensions(): string[];

    async createWidget(options?: any): Promise<Widget> {
        if (DiagramWidgetOptions.is(options)) {
            const clientId = this.createClientId();
            const config = this.diagramConfigurationRegistry.get(options.diagramType);
            const diContainer = config.createContainer(clientId + '_sprotty');
            const diagramWidget = new GLSPDiagramWidget(options, clientId, diContainer, this.editorPreferences, this.diagramConnector);
            return diagramWidget;
        }
        throw Error('DiagramWidgetFactory needs DiagramWidgetOptions but got ' + JSON.stringify(options));
    }
    canHandle(uri: URI, options?: WidgetOpenerOptions | undefined): number {
        for (const extension of this.fileExtensions) {
            if (uri.path.toString().endsWith(extension)) {
                return 101;
            }
        }
        return 0;
    }

    get diagramConnector(): GLSPTheiaSprottyConnector | undefined {
        return undefined;
    }
}
