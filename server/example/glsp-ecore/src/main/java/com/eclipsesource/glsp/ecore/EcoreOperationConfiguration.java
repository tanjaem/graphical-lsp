package com.eclipsesource.glsp.ecore;

import com.eclipsesource.glsp.api.action.kind.RequestOperationsAction;
import com.eclipsesource.glsp.api.operations.IOperationConfiguration;
import com.eclipsesource.glsp.api.operations.Operation;
import com.eclipsesource.glsp.ecore.model.ModelTypes;

public class EcoreOperationConfiguration implements IOperationConfiguration {


	@Override
	public Operation[] getOperations(RequestOperationsAction action) {
		Operation createAutomatedTask = new Operation("Class", ModelTypes.CLASS_NODE_TYPE, Operation.Kind.CREATE_NODE);
		
		Operation[] operations = { createAutomatedTask };
		return operations;
	}

}
