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
import { Action } from "sprotty/lib";
import { EdgeEditConfig } from "../../base/edit-config/edit-config";
import { EdgeTypeHint } from "./action-definition";
import { EditConfig } from "../../base/edit-config/edit-config";
import { FeedbackCommand } from "../tool-feedback/feedback-command";
import { GLSP_TYPES } from "../../types";
import { ICommand } from "sprotty/lib";
import { IEditConfigProvider } from "../../base/edit-config/edit-config";
import { IFeedbackActionDispatcher } from "../tool-feedback/feedback-action-dispatcher";
import { NodeEditConfig } from "../../base/edit-config/edit-config";
import { NodeTypeHint } from "./action-definition";
import { SelfInitializingActionHandler } from "../../base/diagram-ui-extension/diagram-ui-extension-registry";
import { SetTypeHintsAction } from "./action-definition";
import { SModelElement } from "sprotty/lib";
import { SModelElementSchema } from "sprotty/lib";
import { SModelRoot } from "sprotty/lib";
import { TYPES } from "sprotty/lib";

import { contains } from "../../utils/array-utils";
import { edgeEditConfig } from "../../base/edit-config/edit-config";
import { inject } from "inversify";
import { injectable } from "inversify";
import { isEdgeEditConfig } from "../../base/edit-config/edit-config";
import { isNodeEditConfig } from "../../base/edit-config/edit-config";
import { isSetTypeHintsAction } from "./action-definition";
import { nodeEditConfig } from "../../base/edit-config/edit-config";

export class ApplyEditConfigAction implements Action {
    readonly kind = ApplyEditConfigCommand.KIND
    constructor(public readonly editConfigs: Map<string, EditConfig>) { }
}

@injectable()
export class ApplyEditConfigCommand extends FeedbackCommand {
    static KIND = "applyEditConfig";
    readonly priority = 10;
    constructor(@inject(TYPES.Action) protected action: ApplyEditConfigAction) {
        super();
    }
    applyFeedback(root: SModelRoot) {
        root.index.all().forEach(element => {
            const config = this.action.editConfigs.get(element.type)
            if (config) {
                Object.assign(element, config);
            }
        })
    }
}

@injectable()
export class TypeHintsEditConfigProvider extends SelfInitializingActionHandler implements IEditConfigProvider {
    @inject(GLSP_TYPES.IFeedbackActionDispatcher) protected feedbackActionDispatcher: IFeedbackActionDispatcher

    protected editConfigs: Map<string, EditConfig> = new Map
    readonly handledActionKinds = [SetTypeHintsAction.KIND]

    handle(action: Action): ICommand | Action | void {
        if (isSetTypeHintsAction(action)) {
            action.nodeHints.forEach(hint => this.editConfigs.set(hint.elementTypeId, createNodeEditConfig(hint)))
            action.edgeHints.forEach(hint => this.editConfigs.set(hint.elementTypeId, createEdgeEditConfig(hint)))
            this.feedbackActionDispatcher.registerFeedback(this, [new ApplyEditConfigAction(this.editConfigs)]);
        }
    }

    getEditConfig(input: SModelElement | SModelElementSchema | string): EditConfig | undefined {
        return this.editConfigs.get(getElementTypeId(input))
    }

    getAllEdgeEditConfigs(): EdgeEditConfig[] {
        const configs: EdgeEditConfig[] = []
        this.editConfigs.forEach((value, key) => {
            if (isEdgeEditConfig(value)) {
                configs.push(value)
            }
        })
        return configs
    }

    getAllNodeEditConfigs(): NodeEditConfig[] {
        const configs: NodeEditConfig[] = []
        this.editConfigs.forEach((value, key) => {
            if (isNodeEditConfig(value)) {
                configs.push(value)
            }
        })
        return configs
    }
}

export function createNodeEditConfig(hint: NodeTypeHint): NodeEditConfig {
    return <NodeEditConfig>{
        elementTypeId: hint.elementTypeId,
        deletable: hint.deletable,
        repositionable: hint.repositionable,
        resizable: hint.resizable,
        configType: nodeEditConfig,
        isContainableElement: (element) => { return hint.containableElementTypeIds ? contains(hint.containableElementTypeIds, getElementTypeId(element)) : false },
        isContainer: () => { return hint.containableElementTypeIds ? hint.containableElementTypeIds.length > 0 : false }
    }
}


export function createEdgeEditConfig(hint: EdgeTypeHint): EdgeEditConfig {
    return <EdgeEditConfig>{
        elementTypeId: hint.elementTypeId,
        deletable: hint.deletable,
        repositionable: hint.repositionable,
        routable: hint.routable,
        configType: edgeEditConfig,
        isAllowedSource: (source) => { return contains(hint.sourceElementTypeIds, getElementTypeId(source)) },
        isAllowedTarget: (target) => { return contains(hint.targetElementTypeIds, getElementTypeId(target)) }
    }
}

function getElementTypeId(input: SModelElement | SModelElementSchema | string) {
    if (typeof input === 'string') {
        return <string>input
    } else {
        return <string>(<any>input)["type"]
    }
}