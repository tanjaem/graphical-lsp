package com.eclipsesource.glsp.ecore.operationhandler;

import java.util.Optional;

import org.apache.log4j.Logger;
import org.eclipse.emf.ecore.EClass;
import org.eclipse.emf.ecore.EReference;
import org.eclipse.emf.ecore.EcoreFactory;
import org.eclipse.emf.ecore.EcorePackage;
import org.eclipse.sprotty.SEdge;
import org.eclipse.sprotty.SModelRoot;

import com.eclipsesource.glsp.api.action.Action;
import com.eclipsesource.glsp.api.action.kind.CreateConnectionOperationAction;
import com.eclipsesource.glsp.api.handler.IOperationHandler;
import com.eclipsesource.glsp.api.model.IModelState;
import com.eclipsesource.glsp.ecore.emf.EMFCommandService;
import com.eclipsesource.glsp.ecore.emf.EcoreModelStateProvider;
import com.eclipsesource.glsp.ecore.model.EcoreSModelConverter;
import com.eclipsesource.glsp.ecore.model.ModelTypes;
import com.google.inject.Inject;

public class CreateReferenceOperationHandler implements IOperationHandler {
	private static Logger log = Logger.getLogger(CreateReferenceOperationHandler.class);

	@Inject
	private EcoreModelStateProvider modelStateProvider;
	@Inject
	private EMFCommandService commandService;
	@Inject
	private EcoreSModelConverter smodelConverter;

	@Override
	public boolean handles(Action action) {
		if (action instanceof CreateConnectionOperationAction) {
			CreateConnectionOperationAction connectAction = (CreateConnectionOperationAction) action;
			return ModelTypes.REFERENCE.equals(connectAction.getElementTypeId());
		}
		return false;
	}

	@Override
	public Optional<SModelRoot> execute(Action operationAction, IModelState modelState) {
		CreateConnectionOperationAction action = (CreateConnectionOperationAction) operationAction;
		if (action.getSourceElementId() == null || action.getTargetElementId() == null) {
			log.warn("Incomplete create connection action");
			return Optional.empty();
		}
		SModelRoot root = modelState.getCurrentModel();
		modelStateProvider.getModelState(modelState.getClientId()).ifPresent(eModelState -> {
			Optional<EClass> source = eModelState.getIndex().get(action.getSourceElementId(), EClass.class);
			Optional<EClass> target = eModelState.getIndex().get(action.getTargetElementId(), EClass.class);
			if (source.isPresent() && target.isPresent()) {
				EReference reference = EcoreFactory.eINSTANCE.createEReference();
				reference.setEType(target.get());
				reference.setName(target.get().getName().toLowerCase() + "s");
				commandService.add(source.get(), EcorePackage.eINSTANCE.getEClass_EStructuralFeatures(), reference);
				SEdge edge = smodelConverter.createReferenceEdge(reference);
				root.getChildren().add(edge);
				eModelState.getIndex().addToIndex(reference);
			}
		});

		return Optional.ofNullable(root);
	}

}
