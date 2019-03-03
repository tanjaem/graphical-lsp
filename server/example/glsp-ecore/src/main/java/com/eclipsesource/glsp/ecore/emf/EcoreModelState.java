package com.eclipsesource.glsp.ecore.emf;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.eclipse.emf.ecore.EObject;

import com.eclipsesource.glsp.ecore.util.SModelIdUtils;

public class EcoreModelState {
	private EObject currentModel;
	private Map<String, EObject> smodelIndex;
	private boolean dirty;

	public EcoreModelState(EObject currentModel) {
		this.currentModel = currentModel;
		createIndex();
	}

	private void createIndex() {
		smodelIndex = new HashMap<String, EObject>();
		currentModel.eAllContents().forEachRemaining(e -> {
			Optional<String> id = SModelIdUtils.toSModelId(e);
			if (id.isPresent()) {
				smodelIndex.put(id.get(), e);
			}
		});
	}

	public Optional<EObject> getById(String semanticId) {
		return Optional.ofNullable(smodelIndex.get(semanticId));
	}

	public EObject getCurrentModel() {
		return currentModel;
	}

	public void setCurrentModel(EObject currentModel) {
		this.currentModel = currentModel;
	}

	public boolean isDirty() {
		return dirty;
	}

	public void setDirty(boolean dirty) {
		this.dirty = dirty;
	}

}
