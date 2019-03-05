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
package com.eclipsesource.glsp.ecore.model;

import static com.eclipsesource.glsp.ecore.util.ThreadUtil.runDeferred;
import static com.eclipsesource.glsp.server.model.JSONSavemodelDelegator.replaceExtension;

import java.util.Optional;

import org.eclipse.sprotty.SModelRoot;

import com.eclipsesource.glsp.ecore.emf.EcoreModelStateProvider;
import com.eclipsesource.glsp.ecore.emf.ResourceManager;
import com.eclipsesource.glsp.server.model.JSONSModelLoader;
import com.google.inject.Inject;

public class EcoreJSONSModelLoader extends JSONSModelLoader {
	@Inject
	private ResourceManager resourceManager;
	@Inject
	private EcoreModelStateProvider modelStateProvider;
	@Inject
	private EcoreSModelConverter smodelConverter;

	@Override
	public Optional<SModelRoot> loadFromFile(String fileURI, String clientId) {
		Optional<SModelRoot> modelRoot = super.loadFromFile(fileURI, clientId);
		runDeferred(() -> {
			new EcoreXMIModelLoader(resourceManager, modelStateProvider, smodelConverter)
					.loadFromFile(replaceExtension(fileURI, "ecore"), clientId);
		});
		return modelRoot;
	}
	
	

}
//