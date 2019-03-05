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

import { inject, injectable } from "inversify";
import {
    Action, AnchorComputerRegistry, EnableDefaultToolsAction, findParent, isCtrlOrCmd, //
    MouseTool, SModelElement, SModelRoot, SNode, Tool
} from "sprotty/lib";
import { EdgeEditConfig, IEditConfigProvider } from "src/base/edit-config/edit-config";
import { TypeAware } from "../../base/tool-manager/tool-manager-action-handler";
import { GLSP_TYPES } from "../../types";
import { getAbsolutePosition } from "../../utils/viewpoint-util";
import { CreateConnectionOperationAction, CreateNodeOperationAction } from "../operation/operation-actions";
import { deriveOperationId, OperationKind } from "../operation/set-operations";
import { ApplyCursorCSSFeedbackAction, DrawEdgeFeedbackAction, FeedbackEdgeEndMovingMouseListener, RemoveEdgeFeedbackAction } from "../tool-feedback/creation-tool-feedback";
import { CursorCSS } from "../tool-feedback/cursor-css";
import { IFeedbackActionDispatcher } from "../tool-feedback/feedback-action-dispatcher";
import { DragAwareMouseListener } from "./drag-aware-mouse-listener";

export const TOOL_ID_PREFIX = "tool"

export function deriveToolId(operationKind: string, elementTypeId?: string) {
    return `${TOOL_ID_PREFIX}_${deriveOperationId(operationKind, elementTypeId)}`
}

@injectable()
export class NodeCreationTool implements Tool, TypeAware {
    public elementTypeId: string = "unknown";
    protected creationToolMouseListener: NodeCreationToolMouseListener;

    constructor(@inject(MouseTool) protected mouseTool: MouseTool,
        @inject(GLSP_TYPES.IFeedbackActionDispatcher) protected feedbackDispatcher: IFeedbackActionDispatcher) { }

    get id() {
        return deriveToolId(OperationKind.CREATE_NODE, this.elementTypeId)
    };

    enable() {
        this.creationToolMouseListener = new NodeCreationToolMouseListener(this.elementTypeId);
        this.mouseTool.register(this.creationToolMouseListener);
        this.feedbackDispatcher.registerFeedback(this, [new ApplyCursorCSSFeedbackAction(CursorCSS.NODE_CREATION)])
    }

    disable() {
        this.mouseTool.deregister(this.creationToolMouseListener);
        this.feedbackDispatcher.deregisterFeedback(this, [new ApplyCursorCSSFeedbackAction()])
    }
}

@injectable()
export class NodeCreationToolMouseListener extends DragAwareMouseListener {

    constructor(protected elementTypeId: string) {
        super();
    }

    nonDraggingMouseUp(target: SModelElement, event: MouseEvent): Action[] {
        const location = getAbsolutePosition(target, event);
        const containerId: string | undefined = target instanceof SModelRoot ? undefined : target.id;
        const result: Action[] = [];
        result.push(new CreateNodeOperationAction(this.elementTypeId, location, containerId));
        if (!isCtrlOrCmd(event)) {
            result.push(new EnableDefaultToolsAction());
        }
        return result;
    }

}

/**
 * Tool to create connections in a Diagram, by selecting a source and target node.
 */
@injectable()
export class EdgeCreationTool implements Tool, TypeAware {
    public elementTypeId: string = "unknown";
    protected creationToolMouseListener: EdgeCreationToolMouseListener;
    protected feedbackEndMovingMouseListener: FeedbackEdgeEndMovingMouseListener;

    constructor(@inject(MouseTool) protected mouseTool: MouseTool,
        @inject(GLSP_TYPES.IFeedbackActionDispatcher) protected feedbackDispatcher: IFeedbackActionDispatcher,
        @inject(AnchorComputerRegistry) protected anchorRegistry: AnchorComputerRegistry,
        @inject(GLSP_TYPES.IEditConfigProvider) protected editConfigProvider: IEditConfigProvider) { }

    get id() {
        return deriveToolId(OperationKind.CREATE_CONNECTION, this.elementTypeId)
    };

    enable() {
        const editConfig = this.editConfigProvider.getEditConfig(this.elementTypeId) as EdgeEditConfig;
        this.creationToolMouseListener = new EdgeCreationToolMouseListener(this.elementTypeId, this, editConfig);
        this.mouseTool.register(this.creationToolMouseListener);
        this.feedbackEndMovingMouseListener = new FeedbackEdgeEndMovingMouseListener(this.anchorRegistry);
        this.mouseTool.register(this.feedbackEndMovingMouseListener);
        this.dispatchFeedback([new ApplyCursorCSSFeedbackAction(CursorCSS.EDGE_CREATION_SOURCE)]);
    }

    disable() {
        this.mouseTool.deregister(this.creationToolMouseListener);
        this.mouseTool.deregister(this.feedbackEndMovingMouseListener);
        this.feedbackDispatcher.deregisterFeedback(this, [new RemoveEdgeFeedbackAction(), new ApplyCursorCSSFeedbackAction()]);
    }

    dispatchFeedback(actions: Action[]) {
        this.feedbackDispatcher.registerFeedback(this, actions);
    }

}

@injectable()
export class EdgeCreationToolMouseListener extends DragAwareMouseListener {

    private source?: string;
    private target?: string;
    private currentTarget?: SModelElement;
    private allowedTarget: boolean;

    constructor(protected elementTypeId: string, protected tool: EdgeCreationTool, protected edgeConfig?: EdgeEditConfig) {
        super();
    }

    private reinitialize() {
        this.source = undefined;
        this.target = undefined;
        this.currentTarget = undefined;
        this.allowedTarget = false;
        this.tool.dispatchFeedback([new ApplyCursorCSSFeedbackAction(CursorCSS.EDGE_CREATION_NOT_ALLOWED)])
    }

    nonDraggingMouseUp(element: SModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        // If a click was executed on the root element cannel the operation
        if (element instanceof SModelRoot) {
            return [new EnableDefaultToolsAction()]
        }
        if (this.source === undefined) {
            if (this.currentTarget && this.allowedTarget) {
                this.source = this.currentTarget.id;
                this.tool.dispatchFeedback([new DrawEdgeFeedbackAction(this.elementTypeId, this.source)]);
            }
        } else {
            if (this.currentTarget && this.allowedTarget) {
                this.target = this.currentTarget.id;
            }
        }

        if (this.source !== undefined && this.target !== undefined) {
            result.push(new CreateConnectionOperationAction(this.elementTypeId, this.source, this.target));
            if (!isCtrlOrCmd(event)) {
                result.push(new EnableDefaultToolsAction());
            } else {
                this.reinitialize();
            }
        }

        return result;
    }


    mouseOver(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        const result: Action[] = [];
        const newCurrentTarget = findParent(target, e => e instanceof SNode);
        if (newCurrentTarget !== this.currentTarget) {
            this.currentTarget = newCurrentTarget;
            if (this.currentTarget) {
                this.allowedTarget = this.edgeConfig ? this.edgeConfig.isAllowedTarget(this.currentTarget) : true;
                if (!this.allowedTarget) {
                    result.push(new ApplyCursorCSSFeedbackAction(CursorCSS.EDGE_CREATION_NOT_ALLOWED))
                } else {
                    const action = this.source === undefined ? new ApplyCursorCSSFeedbackAction(CursorCSS.EDGE_CREATION_SOURCE) :
                        new ApplyCursorCSSFeedbackAction(CursorCSS.EDGE_CREATION_TARGET);
                    result.push(action)
                }
            } else {
                const action = this.source === undefined ? new ApplyCursorCSSFeedbackAction(CursorCSS.EDGE_CREATION_SOURCE) :
                    new ApplyCursorCSSFeedbackAction(CursorCSS.EDGE_CREATION_TARGET);
                result.push(action)
            }
        }
        return result;
    }
}