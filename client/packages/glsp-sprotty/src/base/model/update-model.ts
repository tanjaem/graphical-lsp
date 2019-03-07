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
import { ActionHandlerRegistry } from "sprotty/lib";
import { CommandActionHandler } from "sprotty/lib";
import { CommandExecutionContext } from "sprotty/lib";
import { CommandResult } from "sprotty/lib";
import { FeedbackCommand } from "../../features/tool-feedback/feedback-command";
import { GLSP_TYPES } from "../../types";
import { IFeedbackActionDispatcher } from "../../features/tool-feedback/feedback-action-dispatcher";
import { ILogger } from "sprotty/lib";
import { SModelRoot } from "sprotty/lib";
import { TYPES } from "sprotty/lib";
import { UpdateModelAction } from "sprotty/lib";
import { UpdateModelCommand } from "sprotty/lib";

import { inject } from "inversify";
import { injectable } from "inversify";
import { optional } from "inversify";

/**
 * A special`UpdateModelCommand` that retrieves all registered `actions` from the `IFeedbackActionDispatcher` (if present) and applies their feedback
 * to the `newRoot` before performing the update
 */
@injectable()
export class FeedbackAwareUpdateModelCommand extends UpdateModelCommand {
    constructor(@inject(TYPES.Action) action: UpdateModelAction,
        @inject(TYPES.ILogger) protected logger: ILogger,
        @inject(GLSP_TYPES.IFeedbackActionDispatcher) @optional() protected readonly feedbackActionDispatcher: IFeedbackActionDispatcher,
        @inject(TYPES.ActionHandlerRegistryProvider) protected actionHandlerRegistryProvider: () => Promise<ActionHandlerRegistry>) {
        super(action)
    }

    protected performUpdate(oldRoot: SModelRoot, newRoot: SModelRoot, context: CommandExecutionContext): CommandResult {
        if (this.feedbackActionDispatcher) {
            this.actionHandlerRegistryProvider().then(registry => {
                const feedbackCommands = this.getFeedbackCommands(registry);
                feedbackCommands.forEach(command => command.applyFeedback(newRoot));
            })
        }
        return super.performUpdate(oldRoot, newRoot, context);

    }

    private getFeedbackCommands(registry: ActionHandlerRegistry): FeedbackCommand[] {
        const result: FeedbackCommand[] = [];
        this.feedbackActionDispatcher.getRegisteredFeedback().forEach(action => {
            const handler = registry.get(action.kind).find(h => h instanceof CommandActionHandler)
            if (handler instanceof CommandActionHandler) {
                const command = handler.handle(action)
                if (command instanceof FeedbackCommand) {
                    result.push(command)
                }
            }
        })
        // sort commands descanding by priority
        return result.sort((a, b) => b.priority - a.priority)

    }

}