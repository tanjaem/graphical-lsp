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
package com.eclipsesource.glsp.server.model;

import java.net.URI;
import java.util.Comparator;
import java.util.Optional;
import java.util.Set;

import org.eclipse.sprotty.SGraph;
import org.eclipse.sprotty.SModelRoot;

import com.eclipsesource.glsp.api.action.kind.RequestModelAction;
import com.eclipsesource.glsp.api.factory.IModelFactory;
import com.eclipsesource.glsp.api.utils.ModelOptions;
import com.google.inject.Inject;

/**
 * A model factory for models that are persisted as files. Delegates the the
 * corresponding registered IModelLoader for the fileExtension (if present)
 * 
 * @author Tobias Ortmayr<tortmayr@eclipsesource.com>
 *
 */
public class FileBasedModelFactory implements IModelFactory {
	static SModelRoot emptyRoot() {
		SModelRoot root = new SGraph();
		root.setType("graph");
		root.setId("graph");
		return root;
	}

	private Set<IModelLoader> modelLoaders;

	@Inject
	public FileBasedModelFactory(Set<IModelLoader> modelLoaders) {
		this.modelLoaders = modelLoaders;
	}

	@Override
	public SModelRoot loadModel(RequestModelAction action) {
		String uri = action.getOptions().get(ModelOptions.SOURCE_URI);
		if (uri != null) {
			URI sourceURI = URI.create(uri);
			Optional<IModelLoader> loader = modelLoaders.stream()
					.sorted(Comparator.comparing(IModelLoader::getPriority)).filter(ml -> ml.handles(sourceURI))
					.findFirst();
			if (loader.isPresent()) {
				return loader.get().generate(sourceURI);
			}
		}
		return emptyRoot();

	}
}
