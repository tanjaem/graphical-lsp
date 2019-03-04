package com.eclipsesource.glsp.ecore.operationhandler;

import static com.eclipsesource.glsp.ecore.util.ThreadUtil.runDeferred;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

import org.eclipse.emf.ecore.EClass;
import org.eclipse.emf.ecore.EObject;
import org.eclipse.emf.ecore.EcoreFactory;
import org.eclipse.emf.ecore.EcorePackage;
import org.eclipse.sprotty.Point;
import org.eclipse.sprotty.SModelElement;
import org.eclipse.sprotty.SModelRoot;

import com.eclipsesource.glsp.api.action.Action;
import com.eclipsesource.glsp.api.action.kind.CreateNodeOperationAction;
import com.eclipsesource.glsp.api.model.IModelState;
import com.eclipsesource.glsp.ecore.emf.EMFCommandService;
import com.eclipsesource.glsp.ecore.emf.EcoreModelState;
import com.eclipsesource.glsp.ecore.emf.EcoreModelStateProvider;
import com.eclipsesource.glsp.ecore.model.EcoreSModelConverter;
import com.eclipsesource.glsp.ecore.model.ModelTypes;
import com.eclipsesource.glsp.server.operationhandler.CreateNodeOperationHandler;
import com.google.inject.Inject;

public class CreateEClassOperationHandler extends CreateNodeOperationHandler {

	private List<String> handledElementTypeIds = Arrays.asList(ModelTypes.ECLASS, ModelTypes.ECLASS + "_Interface",
			ModelTypes.ECLASS + "_Abstract");
	@Inject
	private EcoreModelStateProvider modelStateProvider;
	@Inject
	private EMFCommandService commandService;
	@Inject
	private EcoreSModelConverter smodelConverter;

	private String elementTypeId;

	@Override
	public boolean handles(Action execAction) {
		if (execAction instanceof CreateNodeOperationAction) {
			CreateNodeOperationAction action = (CreateNodeOperationAction) execAction;
			return handledElementTypeIds.contains(action.getElementTypeId());
		}
		return false;
	}

	@Override
	public Optional<SModelRoot> execute(Action action, IModelState modelState) {
		elementTypeId = ((CreateNodeOperationAction) action).getElementTypeId();
		return super.execute(action, modelState);
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
		if (elementTypeId.endsWith("_Abstract")) {
			eClass.setAbstract(true);
		} else if (elementTypeId.endsWith("_Interface")) {
			eClass.setInterface(true);
		}
		Function<Integer, String> idProvider = i -> "class" + i;
		int nodeCounter = getCounter(modelState.getCurrentModelIndex(), ModelTypes.ECLASS, idProvider);
		eClass.setName(idProvider.apply(nodeCounter));
		runDeferred(() -> {
			commandService.add(root, EcorePackage.eINSTANCE.getEPackage_EClassifiers(), eClass);
			ecoreModelState.get().setDirty(true);
		});
		ecoreModelState.get().getIndex().addToIndex(eClass);
		return smodelConverter.createClassNode(eClass, false, point);
	}

}
