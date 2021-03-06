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
import { ActivityNodeSchema } from "./model-schema";
import { Bounds } from "glsp-sprotty/lib";
import { CommandExecutor } from "glsp-sprotty/lib";
import { DiamondNode } from "glsp-sprotty/lib";
import { Expandable } from "glsp-sprotty/lib";
import { LayoutContainer } from "glsp-sprotty/lib";
import { Nameable } from "glsp-sprotty/lib";
import { RectangularNode } from "glsp-sprotty/lib";
import { SEdge } from "glsp-sprotty/lib";
import { SShapeElement } from "glsp-sprotty/lib";

import { boundsFeature } from "glsp-sprotty/lib";
import { executeCommandFeature } from "glsp-sprotty/lib";
import { expandFeature } from "glsp-sprotty/lib";
import { fadeFeature } from "glsp-sprotty/lib";
import { layoutableChildFeature } from "glsp-sprotty/lib";
import { layoutContainerFeature } from "glsp-sprotty/lib";
import { nameFeature } from "glsp-sprotty/lib";

export class TaskNode extends RectangularNode implements Expandable, Nameable {
    expanded: boolean;
    name: string = "";
    duration?: number;
    taskType?: string;
    reference?: string;

    hasFeature(feature: symbol) {
        return feature === expandFeature || feature === nameFeature || super.hasFeature(feature);
    }
}

export class WeightedEdge extends SEdge {
    probability?: string;
}

export class ActivityNode extends DiamondNode {
    nodeType: string = ActivityNodeSchema.Type.UNDEFINED;
    size = {
        width: 32,
        height: 32
    };
    strokeWidth = 1;

    hasFeature(feature: symbol): boolean {
        return super.hasFeature(feature);
    }
}


export class Icon extends SShapeElement implements LayoutContainer, CommandExecutor {
    commandId: string;
    layout: string;
    layoutOptions?: { [key: string]: string | number | boolean; };
    bounds: Bounds;
    size = {
        width: 32,
        height: 32
    };

    hasFeature(feature: symbol): boolean {
        return feature === executeCommandFeature
            || feature === boundsFeature || feature === layoutContainerFeature
            || feature === layoutableChildFeature || feature === fadeFeature;
    }
}
