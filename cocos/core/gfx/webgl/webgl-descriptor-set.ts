import { GFXDescriptorSet, IGFXDescriptorSetInfo, DESCRIPTOR_SAMPLER_TYPE, DESCRIPTOR_BUFFER_TYPE } from '../descriptor-set';
import { GFXStatus } from '../define';
import { WebGLBuffer } from './webgl-buffer';
import { IWebGLGPUDescriptorSet, IWebGLGPUDescriptor } from './webgl-gpu-objects';
import { WebGLSampler } from './webgl-sampler';
import { WebGLTexture } from './webgl-texture';

export class WebGLDescriptorSet extends GFXDescriptorSet {

    get gpuDescriptorSet (): IWebGLGPUDescriptorSet {
        return this._gpuDescriptorSet as IWebGLGPUDescriptorSet;
    }

    private _gpuDescriptorSet: IWebGLGPUDescriptorSet | null = null;

    public initialize (info: IGFXDescriptorSetInfo): boolean {

        Array.prototype.push.apply(this._layout, info.bindings);
        this._buffers = Array(this._layout.length).fill(null);
        this._textures = Array(this._layout.length).fill(null);
        this._samplers = Array(this._layout.length).fill(null);

        const gpuDescriptors: IWebGLGPUDescriptor[] = [];
        this._gpuDescriptorSet = { gpuDescriptors };

        for (let i = 0; i < info.bindings.length; ++i) {
            gpuDescriptors.push({
                type: info.bindings[i].descriptorType,
                gpuBuffer: null,
                gpuTexture: null,
                gpuSampler: null,
            });
        }

        this._status = GFXStatus.SUCCESS;

        return true;
    }

    public destroy () {
        this._layout.length = 0;
        this._gpuDescriptorSet = null;
        this._status = GFXStatus.UNREADY;
    }

    public update () {
        if (this._isDirty && this._gpuDescriptorSet) {
            for (let i = 0; i < this._layout.length; ++i) {
                if (this._layout[i].descriptorType & DESCRIPTOR_BUFFER_TYPE) {
                    if (this._buffers[i]) {
                        this._gpuDescriptorSet.gpuDescriptors[i].gpuBuffer =
                            (this._buffers[i] as WebGLBuffer).gpuBuffer;
                    }
                } else if (this._layout[i].descriptorType & DESCRIPTOR_SAMPLER_TYPE) {
                    if (this._textures[i]) {
                        this._gpuDescriptorSet.gpuDescriptors[i].gpuTexture =
                            (this._textures[i] as WebGLTexture).gpuTexture;
                    }
                    if (this._samplers[i]) {
                        this._gpuDescriptorSet.gpuDescriptors[i].gpuSampler =
                            (this._samplers[i] as WebGLSampler).gpuSampler;
                    }
                }
            }
            this._isDirty = false;
        }
    }
}
