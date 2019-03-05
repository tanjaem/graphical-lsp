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
package com.eclipsesource.glsp.ecore.emf;

import java.util.Collection;

import org.eclipse.emf.common.command.Command;
import org.eclipse.emf.ecore.EObject;
import org.eclipse.emf.edit.command.AddCommand;
import org.eclipse.emf.edit.command.DeleteCommand;
import org.eclipse.emf.edit.domain.EditingDomain;
import static com.eclipsesource.glsp.ecore.util.ThreadUtil.runDeferred;
import com.google.inject.Inject;
import com.google.inject.Singleton;

@Singleton
public class EMFCommandService {
	@Inject
	private ResourceManager resourceManager;

	public void delete(Collection<EObject> toDelete) {
		runDeferred(() -> {
			EditingDomain editingDomain = resourceManager.getEditingDomain();
			Command cmd = DeleteCommand.create(editingDomain, toDelete);
			editingDomain.getCommandStack().execute(cmd);
		});
	}

	public void add(Object owner, Object feature, Object value) {
		runDeferred(() -> {
			EditingDomain editingDomain = resourceManager.getEditingDomain();
			Command cmd = AddCommand.create(editingDomain, owner, feature, value);
			editingDomain.getCommandStack().execute(cmd);
		});

	}
}