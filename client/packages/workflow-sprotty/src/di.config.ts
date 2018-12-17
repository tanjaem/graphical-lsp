/*******************************************************************************
 * Copyright (c) 2018 EclipseSource Services GmbH and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * Contributors:
 * 	Tobias Ortmayr - initial API and implementation
 ******************************************************************************/

// tslint:disable-next-line:max-line-length
import { boundsModule, buttonModule, CenterCommand, CenterKeyboardListener, configureModelElement, ConsoleLogger, defaultGLSPModule, defaultModule, DiamondNodeView, ExpandButtonView, expandModule, exportModule, fadeModule, FitToScreenCommand, GLSPGraph, hoverModule, HtmlRoot, HtmlRootView, LogLevel, modelSourceModule, moveModule, openModule, overrideViewerOptions, PreRenderedElement, PreRenderedView, RectangularNode, RectangularNodeView, saveModule, SButton, SCompartment, SCompartmentView, ScrollMouseListener, SEdge, selectModule, SGraphView, SLabel, SLabelView, SRoutingHandle, SRoutingHandleView, toolFeedbackModule, toolManagerModule, TYPES, undoRedoModule, ViewportCommand } from "glsp-sprotty/lib";
import { boundsModule, buttonModule, CenterCommand, CenterKeyboardListener, configureModelElement, ConsoleLogger, defaultModule, DiamondNodeView, ExpandButtonView, expandModule, exportModule, fadeModule, FitToScreenCommand, GLSPGraph, hoverModule, HtmlRoot, HtmlRootView, LogLevel, modelSourceModule, openModule, overrideViewerOptions, PreRenderedElement, PreRenderedView, RectangularNode, RectangularNodeView, saveModule, SButton, SCompartment, SCompartmentView, ScrollMouseListener, SEdge, selectModule, SGraphView, SLabel, SLabelView, SRoutingHandle, SRoutingHandleView, toolFeedbackModule, toolManagerModule, TYPES, undoRedoModule, ViewportCommand } from "glsp-sprotty/lib";
import executeCommandModule from "glsp-sprotty/lib/features/execute/di.config";
import { Container, ContainerModule } from "inversify";
import { ActivityNode, Icon, TaskNode, WeightedEdge } from "./model";
import { WorkflowModelFactory } from "./model-factory";
import { IconView, TaskNodeView, WeightedEdgeView, WorkflowEdgeView } from "./workflow-views";



const workflowDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope()
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn)
    rebind(TYPES.IModelFactory).to(WorkflowModelFactory).inSingletonScope()
    const context = { bind, unbind, isBound, rebind };
    configureModelElement(context, 'graph', GLSPGraph, SGraphView);
    configureModelElement(context, 'node:task', TaskNode, TaskNodeView);
    configureModelElement(context, 'label:heading', SLabel, SLabelView);
    configureModelElement(context, 'label:text', SLabel, SLabelView);
    configureModelElement(context, 'comp:comp', SCompartment, SCompartmentView);
    configureModelElement(context, 'comp:header', SCompartment, SCompartmentView);
    configureModelElement(context, 'label:icon', SLabel, SLabelView);
    configureModelElement(context, 'html', HtmlRoot, HtmlRootView);
    configureModelElement(context, 'pre-rendered', PreRenderedElement, PreRenderedView);
    configureModelElement(context, 'button:expand', SButton, ExpandButtonView);
    configureModelElement(context, 'routing-point', SRoutingHandle, SRoutingHandleView);
    configureModelElement(context, 'volatile-routing-point', SRoutingHandle, SRoutingHandleView);
    configureModelElement(context, 'edge', SEdge, WorkflowEdgeView)
    configureModelElement(context, 'edge:weighted', WeightedEdge, WeightedEdgeView)
    configureModelElement(context, 'icon', Icon, IconView);
    configureModelElement(context, 'node:activity', ActivityNode, DiamondNodeView)
    configureModelElement(context, 'node', RectangularNode, RectangularNodeView)
});

const workflowViewportModule = new ContainerModule(bind => {
    bind(TYPES.ICommand).toConstructor(CenterCommand);
    bind(TYPES.ICommand).toConstructor(FitToScreenCommand);
    bind(TYPES.ICommand).toConstructor(ViewportCommand);
    bind(TYPES.KeyListener).to(CenterKeyboardListener);
    bind(TYPES.MouseListener).to(ScrollMouseListener);

    // custom viewportModule that omitts the zoom mouse listener that is too greedy (all mouse wheel events lead to viewport zoom)
    // we implement our own zoom in a resizing tool (ResizeTool) that also allows to actually resize individual elements
    // bind(TYPES.MouseListener).to(ZoomMouseListener);
});

export default function createContainer(widgetId: string): Container {
    const container = new Container();

    container.load(defaultModule, selectModule, boundsModule, undoRedoModule, workflowViewportModule,
        hoverModule, fadeModule, exportModule, expandModule, openModule, buttonModule, modelSourceModule,
        workflowDiagramModule, saveModule, executeCommandModule, toolManagerModule, toolFeedbackModule, defaultGLSPModule);

    overrideViewerOptions(container, {
        needsClientLayout: true,
        needsServerLayout: false,
        baseDiv: widgetId
    })

    return container
}
