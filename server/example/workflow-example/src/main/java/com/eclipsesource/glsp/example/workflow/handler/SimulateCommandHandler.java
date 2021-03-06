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
package com.eclipsesource.glsp.example.workflow.handler;

import static com.eclipsesource.glsp.api.utils.OptionsUtil.getValue;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

import org.apache.log4j.Logger;
import org.eclipse.sprotty.SModelElement;

import com.eclipsesource.glsp.api.action.Action;
import com.eclipsesource.glsp.api.handler.ServerCommandHandler;
import com.eclipsesource.glsp.api.model.ModelState;

public class SimulateCommandHandler implements ServerCommandHandler {
	private static Logger logger = Logger.getLogger(SimulateCommandHandler.class);
	public static final String SIMULATE_COMMAND_ID = "simulate-command";
	public static final String OPTIONS_INVOKER_ID = "invokerId";

	@Override
	public boolean handles(String commandId) {
		return SIMULATE_COMMAND_ID.equals(commandId);
	}

	@Override
	public Optional<Action> execute(String commandId, Map<String, String> options, ModelState modelState) {
		Optional<Action> result = Optional.empty();
		if (SIMULATE_COMMAND_ID.equals(commandId)) {
			getValue(options, OPTIONS_INVOKER_ID).ifPresent(id -> {
				SModelElement invoker = modelState.getCurrentModelIndex().get(id);
				if (invoker != null) {
					logger.info("Start simulation of " + invoker.getId());
					double duration = ThreadLocalRandom.current().nextDouble(0d, 10d);
					logger.info("Task simulation finished within " + duration + " seconds");
				}

			});
		}

		return result;
	}

}
