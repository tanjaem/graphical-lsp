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
import { Command } from "sprotty/lib";
import { CommandActionHandler } from "sprotty/lib";
import { CommandExecutionContext } from "sprotty/lib";
import { CommandResult } from "sprotty/lib";
import { FeedbackCommand } from "../../features/tool-feedback/model";
import { GLSP_TYPES } from "../../types";
import { IFeedbackActionDispatcher } from "src/features/tool-feedback/feedback-action-dispatcher";
import { ILogger } from "sprotty/lib";
import { SModelRoot } from "sprotty/lib";
import { TYPES } from "sprotty/lib";
import { UpdateModelAction } from "sprotty/lib/features/update/update-model";
import { UpdateModelCommand } from "sprotty/lib/features/update/update-model";

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
        super(action);
    }

    protected performUpdate(oldRoot: SModelRoot, newRoot: SModelRoot, context: CommandExecutionContext): CommandResult {
        if (this.feedbackActionDispatcher) {
            // Create a temporary context wich defines the `newRoot` as `root`
            // This way we do not corrupt the redo/undo behavior of the super class
            const tempContext: CommandExecutionContext = {
                root: newRoot,
                duration: context.duration,
                logger: context.logger,
                modelChanged: context.modelChanged,
                modelFactory: context.modelFactory,
                syncer: context.syncer
            };
            this.actionHandlerRegistryProvider().then(registry => {
                const feedbackCommands = this.getFeedbackCommands(registry);
                feedbackCommands.forEach(command => command.execute(tempContext));
            });
        }
        return super.performUpdate(oldRoot, newRoot, context);

    }

    private getFeedbackCommands(registry: ActionHandlerRegistry): Command[] {
        const result: Command[] = [];
        this.feedbackActionDispatcher.getRegisteredFeedback().forEach(action => {
            const handler = registry.get(action.kind).find(h => h instanceof CommandActionHandler);
            if (handler instanceof CommandActionHandler) {
                result.push(handler.handle(action));
            }
        });
        // sort commands descanding by priority
        return result.sort((a, b) => getPriority(b) - getPriority(a));
    }
}

function getPriority(command: Command): number {
    if (command instanceof FeedbackCommand) {
        return command.priority;
    }
    return 0;
}
