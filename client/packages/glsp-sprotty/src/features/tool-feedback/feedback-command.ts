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

import { Command } from "sprotty/lib";
import { CommandExecutionContext } from "sprotty/lib";
import { CommandResult } from "sprotty/lib";
import { SModelRoot } from "sprotty/lib";

import { injectable } from "inversify";


@injectable()
export abstract class FeedbackCommand extends Command {
    readonly priority: number = 0;
    execute(context: CommandExecutionContext): SModelRoot {
        this.applyFeedback(context.root);
        return context.root;
    }

    abstract applyFeedback(root: SModelRoot): void

    undo(context: CommandExecutionContext): CommandResult {
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandResult {
        return context.root;
    }
}