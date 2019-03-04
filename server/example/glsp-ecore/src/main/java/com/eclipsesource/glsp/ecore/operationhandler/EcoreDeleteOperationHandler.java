/*******************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
 *  
 *   This program and the accompanying materials are made available under the
 *   terms of the Eclipse Public License v. 2.0 which is available at
 *   http://www.eclipse.org/legal/epl-2.0.
 *  
 *   This Source Code may also be made available under the following Secondary
 *   Licenses when the conditions for such availability set forth in the Eclipse
 *   Public License v. 2.0 are satisfied: GNU General Public License, version 2
 *   with the GNU Classpath Exception which is available at
 *   https://www.gnu.org/software/classpath/license.html.
 *  
 *   SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ******************************************************************************/
package com.eclipsesource.glsp.ecore.operationhandler;

import static com.eclipsesource.glsp.ecore.util.ThreadUtil.runDeferred;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.eclipse.emf.ecore.EObject;
import org.eclipse.sprotty.SModelRoot;

import com.eclipsesource.glsp.api.action.Action;
import com.eclipsesource.glsp.api.action.kind.DeleteElementOperationAction;
import com.eclipsesource.glsp.api.model.IModelState;
import com.eclipsesource.glsp.ecore.emf.EMFCommandService;
import com.eclipsesource.glsp.ecore.emf.EcoreModelState;
import com.eclipsesource.glsp.ecore.emf.EcoreModelStateProvider;
import com.eclipsesource.glsp.server.operationhandler.DeleteElementOperationHandler;
import com.google.inject.Inject;

public class EcoreDeleteOperationHandler extends DeleteElementOperationHandler {
	@Inject
	private EcoreModelStateProvider modelStateProvider;
	@Inject
	private EMFCommandService commandService;

	@Override
	public Optional<SModelRoot> execute(Action execAction, IModelState modelState) {
		Optional<SModelRoot> result = super.execute(execAction, modelState);

		runDeferred(() -> {
			Optional<String> sourceURI = modelState.getOptions().getSourceUri();
			Optional<EcoreModelState> ecoreModelState = modelStateProvider.getModelState(modelState.getClientId());
			if (sourceURI.isPresent()) {
				DeleteElementOperationAction action = (DeleteElementOperationAction) execAction;
				List<String> elementIds = action.getElementIds();
				if (elementIds != null) {
					List<EObject> toDelete = new ArrayList<>();
					elementIds.stream().map(id -> ecoreModelState.get().getIndex().get(id)).filter(opt -> opt.isPresent())
							.forEach(opt -> toDelete.add(opt.get()));

					commandService.delete(toDelete);
					ecoreModelState.get().setDirty(true);
				}
			}

		});

		return result;
	}
	
	

}
