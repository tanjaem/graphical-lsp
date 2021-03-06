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
import { AutocompleteResult } from "autocompleter";
import { AutocompleteSettings } from "autocompleter";
import { BaseDiagramUIExtension } from "../../base/diagram-ui-extension/diagram-ui-extension";
import { GLSP_TYPES } from "../../types";
import { HideDiagramUIExtensionAction } from "../../base/diagram-ui-extension/diagram-ui-extension-registry";
import { IActionDispatcherProvider } from "sprotty/lib";
import { ICommandPaletteActionProviderRegistry } from "./action-provider";
import { ILogger } from "sprotty/lib";
import { KeyListener } from "sprotty/lib";
import { LabeledAction } from "../../base/diagram-ui-extension/diagram-ui-extension";
import { ShowDiagramUIExtensionAction } from "../../base/diagram-ui-extension/diagram-ui-extension-registry";
import { SModelElement } from "sprotty/lib";
import { TYPES } from "sprotty/lib";
import { ViewerOptions } from "sprotty/lib";

import { findParentByFeature } from "sprotty/lib";
import { inject } from "inversify";
import { injectable } from "inversify";
import { isBoundsAware } from "sprotty/lib";
import { isSelectable } from "sprotty/lib";
import { isViewport } from "sprotty/lib";
import { matchesKeystroke } from "sprotty/lib/utils/keyboard";
import { toArray } from "sprotty/lib/utils/iterable";


// import of function autocomplete(...) doesn't work
// see also https://github.com/kraaden/autocomplete/issues/13
// this is a workaround to still get the function including type support
const configureAutocomplete: (settings: AutocompleteSettings<LabeledAction>) => AutocompleteResult = require("autocompleter");

export class CommandPaletteKeyListener extends KeyListener {
    keyDown(element: SModelElement, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, 'Escape')) {
            return [new HideDiagramUIExtensionAction(CommandPalette.ID)];
        } else if (matchesKeystroke(event, 'Space', 'ctrl')) {
            const selected = toArray(element.root.index.all().filter(e => isSelectable(e) && e.selected)).map(e => e.id);
            return [new ShowDiagramUIExtensionAction(CommandPalette.ID, selected)];
        }
        return [];
    }
}

@injectable()
export class CommandPalette extends BaseDiagramUIExtension {
    static readonly ID = "glsp_command_palette";
    readonly id = CommandPalette.ID;

    readonly containerClass = "command-palette";
    readonly xOffset = 20;
    readonly yOffset = 30;
    readonly defaultWidth = 400;

    protected inputElement: HTMLInputElement;
    protected autoCompleteResult: AutocompleteResult;

    protected paletteContext?: SModelElement[];
    protected contextActions?: LabeledAction[];

    constructor(
        @inject(TYPES.ViewerOptions) protected options: ViewerOptions,
        @inject(TYPES.IActionDispatcherProvider) protected actionDispatcherProvider: IActionDispatcherProvider,
        @inject(GLSP_TYPES.ICommandPaletteActionProviderRegistry) protected actionProvider: ICommandPaletteActionProviderRegistry,
        @inject(TYPES.ILogger) protected logger: ILogger) {
        super(options, actionDispatcherProvider, logger);
    }

    show(selectedElements: SModelElement[]) {
        super.show(selectedElements);
        if (this.inputElement.value) {
            this.inputElement.setSelectionRange(0, this.inputElement.value.length);
        }
        this.autoCompleteResult = configureAutocomplete(this.autocompleteSettings(selectedElements));
        this.inputElement.focus();
    }

    protected createUIElements() {
        this.containerElement.style.position = "absolute";
        this.inputElement = document.createElement('input');
        this.inputElement.style.width = '100%';
        this.containerElement.appendChild(this.inputElement);
        this.inputElement.onblur = () => window.setTimeout(() => this.hide(), 200);
    }

    protected updatePosition(selectedElements: SModelElement[]) {
        let x = this.xOffset;
        let y = this.yOffset;
        if (selectedElements.length === 1) {
            const firstElement = selectedElements[0];
            if (isBoundsAware(firstElement)) {
                const viewport = findParentByFeature(firstElement, isViewport);
                if (viewport) {
                    x += (firstElement.bounds.x - viewport.scroll.x) * viewport.zoom;
                    y += (firstElement.bounds.y - viewport.scroll.y) * viewport.zoom;
                } else {
                    x += firstElement.bounds.x;
                    y += firstElement.bounds.y;
                }
            }
        }
        this.containerElement.style.left = `${x}px`;
        this.containerElement.style.top = `${y}px`;
        this.containerElement.style.width = `${this.defaultWidth}px`;
    }

    private autocompleteSettings(selectedElements: SModelElement[]): AutocompleteSettings<LabeledAction> {
        return {
            input: this.inputElement,
            emptyMsg: "No commands available",
            className: "command-palette-suggestions",
            minLength: -1,
            fetch: (text: string, update: (items: LabeledAction[]) => void) => {
                if (this.paletteContext === selectedElements && this.contextActions) {
                    update(this.filterActions(text, this.contextActions));
                } else {
                    this.paletteContext = selectedElements;
                    this.actionProvider()
                        .then(provider => provider.getActions(selectedElements))
                        .then(actions => {
                            this.contextActions = actions;
                            update(this.filterActions(text, actions));
                        })
                        .catch((reason) => this.logger.error(this, "Failed to obtain actions from command palette action providers", reason));
                }
            },
            onSelect: (item: LabeledAction) => {
                this.executeAction(item);
                this.hide();
            },
            customize: (input: HTMLInputElement, inputRect: ClientRect | DOMRect, container: HTMLDivElement, maxHeight: number) => {
                // move container into our command palette container as this is already positioned correctly
                if (this.containerElement) {
                    this.containerElement.appendChild(container);
                }
            }
        };
    }

    protected filterActions(filterText: string, actions: LabeledAction[]): LabeledAction[] {
        return toArray(actions.filter(action => {
            const label = action.label.toLowerCase();
            const searchWords = filterText.split(' ');
            return searchWords.every(word => label.indexOf(word.toLowerCase()) !== -1);
        }));
    }

    hide() {
        super.hide();
        this.paletteContext = undefined;
        this.contextActions = undefined;
        if (this.autoCompleteResult) {
            this.autoCompleteResult.destroy();
        }
    }
}
