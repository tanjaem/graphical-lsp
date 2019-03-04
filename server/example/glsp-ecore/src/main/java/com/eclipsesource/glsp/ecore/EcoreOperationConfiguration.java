package com.eclipsesource.glsp.ecore;

import com.eclipsesource.glsp.api.action.kind.RequestOperationsAction;
import com.eclipsesource.glsp.api.operations.IOperationConfiguration;
import com.eclipsesource.glsp.api.operations.Operation;
import com.eclipsesource.glsp.ecore.model.ModelTypes;

public class EcoreOperationConfiguration implements IOperationConfiguration {

	@Override
	public Operation[] getOperations(RequestOperationsAction action) {
		Operation createEClass = new Operation("Class", ModelTypes.ECLASS, Operation.Kind.CREATE_NODE);
		Operation createAbstract = new Operation("Abstract", ModelTypes.ECLASS+ "_Abstract", Operation.Kind.CREATE_NODE);
		Operation createInterface = new Operation("Interface", ModelTypes.ECLASS + "_Interface",
				Operation.Kind.CREATE_NODE);
		Operation createEcoreEdge = new Operation("Reference", ModelTypes.REFERENCE, Operation.Kind.CREATE_CONNECTION);
		Operation createInheritance = new Operation("Inheritance", ModelTypes.INHERITANCE,
				Operation.Kind.CREATE_CONNECTION);
		Operation[] operations = { createEClass,createAbstract,createInterface, createEcoreEdge, createInheritance };
		return operations;
	}

}
