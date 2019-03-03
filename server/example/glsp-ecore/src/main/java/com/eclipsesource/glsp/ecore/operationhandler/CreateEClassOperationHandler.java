package com.eclipsesource.glsp.ecore.operationhandler;

import java.util.Optional;
import java.util.function.Function;

import org.eclipse.emf.ecore.EClass;
import org.eclipse.emf.ecore.EObject;
import org.eclipse.emf.ecore.EcoreFactory;
import org.eclipse.emf.ecore.EcorePackage;
import org.eclipse.sprotty.Point;
import org.eclipse.sprotty.SModelElement;

import com.eclipsesource.glsp.api.action.Action;
import com.eclipsesource.glsp.api.action.kind.CreateNodeOperationAction;
import com.eclipsesource.glsp.api.model.IModelState;
import com.eclipsesource.glsp.api.model.IModelStateProvider;
import com.eclipsesource.glsp.api.utils.SModelIndex;
import com.eclipsesource.glsp.ecore.emf.EMFCommandService;
import com.eclipsesource.glsp.ecore.emf.EcoreModelState;
import com.eclipsesource.glsp.ecore.emf.EcoreModelStateProvider;
import com.eclipsesource.glsp.ecore.model.EcoreSModelConverter;
import com.eclipsesource.glsp.ecore.model.ModelTypes;
import com.eclipsesource.glsp.server.operationhandler.CreateNodeOperationHandler;
import com.google.inject.Inject;
import static com.eclipsesource.glsp.ecore.util.ThreadUtil.runDeferred;

public class CreateEClassOperationHandler extends CreateNodeOperationHandler {

	@Inject
	private EcoreModelStateProvider modelStateProvider;
	@Inject
	private EMFCommandService commandService;
	@Inject
	private EcoreSModelConverter smodelConverter;

	@Override
	public boolean handles(Action execAction) {
		if (execAction instanceof CreateNodeOperationAction) {
			CreateNodeOperationAction action = (CreateNodeOperationAction) execAction;
			return ModelTypes.CLASS_NODE_TYPE.equals(action.getElementTypeId());
		}
		return false;
	}

	@Override
	protected SModelElement createNode(Optional<Point> point, IModelState modelState) {
		String clientId = modelState.getClientId();
		Optional<EcoreModelState> ecoreModelState = modelStateProvider.getModelState(clientId);
		if (!ecoreModelState.isPresent()) {
			return null;
		}
		EObject root = ecoreModelState.get().getCurrentModel();
		EClass eClass = EcoreFactory.eINSTANCE.createEClass();
		Function<Integer, String> idProvider = i -> "class" + i;
		int nodeCounter = getCounter(modelState.getCurrentModelIndex(), ModelTypes.CLASS_NODE_TYPE, idProvider);
		eClass.setName(idProvider.apply(nodeCounter));
		runDeferred(() -> {
			commandService.add(root, EcorePackage.eINSTANCE.getEPackage_EClassifiers(), eClass);
			ecoreModelState.get().setDirty(true);
		});
		return smodelConverter.createClassNode(eClass, false, point);
	}

}
