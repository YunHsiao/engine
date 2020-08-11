/**
 * @category gfx
 */

import { GFXDescriptorType, GFXObject, GFXObjectType, GFXShaderStageFlags } from './define';
import { GFXDevice } from './device';
import { GFXSampler } from './sampler';

export interface IGFXDescriptorSetLayoutBinding {
    descriptorType: GFXDescriptorType;
    count: number;
    stageFlags: GFXShaderStageFlags;
    immutableSamplers?: GFXSampler[];
}

export interface IGFXDescriptorSetLayoutInfo {
    // array index is used as the binding numbers,
    // i.e. they should be strictly consecutive and start from 0
    bindings: IGFXDescriptorSetLayoutBinding[];
}

/**
 * @en GFX descriptor sets layout.
 * @zh GFX 描述符集布局。
 */
export abstract class GFXDescriptorSetLayout extends GFXObject {

    protected _device: GFXDevice;

    protected _bindings: IGFXDescriptorSetLayoutBinding[] = [];

    constructor (device: GFXDevice) {
        super(GFXObjectType.DESCRIPTOR_SET_LAYOUT);
        this._device = device;
    }

    public abstract initialize (info: IGFXDescriptorSetLayoutInfo): boolean;

    public abstract destroy (): void;
}
