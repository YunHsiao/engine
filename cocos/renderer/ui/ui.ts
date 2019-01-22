
import { Material } from '../../3d/assets/material';
import RecyclePool from '../../3d/memop/recycle-pool';
import { CanvasComponent } from '../../3d/ui/components/canvas-component';
import { UIRenderComponent } from '../../3d/ui/components/ui-render-component';
import { IMeshBufferInitData, MeshBuffer } from '../../3d/ui/mesh-buffer';
import { CachedArray } from '../../core/memop/cached-array';
import { Root } from '../../core/root';
import { GFXBindingLayout } from '../../gfx/binding-layout';
import { GFXBuffer } from '../../gfx/buffer';
import { GFXCommandBuffer } from '../../gfx/command-buffer';
import {
    GFXBufferUsageBit,
    GFXCommandBufferType,
    GFXFormat,
    GFXMemoryUsageBit,
    IGFXRect,
} from '../../gfx/define';
import { GFXDevice } from '../../gfx/device';
import { GFXInputAssembler, IGFXInputAttribute } from '../../gfx/input-assembler';
import { GFXPipelineLayout } from '../../gfx/pipeline-layout';
import { GFXPipelineState } from '../../gfx/pipeline-state';
import { vfmt } from '../../gfx/vertex-format-sample';
import { BaseNode } from '../../scene-graph/base-node';
import { Pass } from '../core/pass';
import { Camera } from '../scene/camera';
import { RenderScene } from '../scene/render-scene';
import { SpriteFrame } from '../../assets/CCSpriteFrame';

export interface IUIBufferBatch {
    vb: GFXBuffer;
    ib: GFXBuffer;
}

export interface IUIMaterial {
    material: Material;
    bindingLayout: GFXBindingLayout;
    pipelineLayout: GFXPipelineLayout;
    pipelineState: GFXPipelineState;
}

export interface IUIRenderItem {
    camera: Camera;
    pass: Pass;
    bindingLayout: GFXBindingLayout;
    pipelineLayout: GFXPipelineLayout;
    pipelineState: GFXPipelineState;
    inputAssembler: GFXInputAssembler;
}

export interface IUIRenderData {
    meshBuffer: MeshBuffer;
    material: Material;
    texture: SpriteFrame,
    camera: Camera;
}

export class UI {
    private _commitUIRenderDataPool: RecyclePool = new RecyclePool(() => {
        return new Object() as IUIRenderData;
    }, 128);

    private _screens: CanvasComponent[] = [];
    private _bufferPool: RecyclePool<MeshBuffer> = new RecyclePool(() => {
        return new MeshBuffer();
    }, 128);
    private _device: GFXDevice;
    private _cmdBuff: GFXCommandBuffer | null = null;
    private _renderArea: IGFXRect = { x: 0, y: 0, width: 0, height: 0 };
    private _scene: RenderScene;
    private _attributes: IGFXInputAttribute[] = [];
    private _bufferBatches: IUIBufferBatch[] = [];
    private _uiMaterials: IUIMaterial[] = [];
    private _items: CachedArray<IUIRenderItem>;
    private _bufferInitData: IMeshBufferInitData | null = null;
    private _commitUIRenderDatas: IUIRenderData[] = [];

    constructor (private _root: Root) {
        this._device = _root.device;
        this._scene = this._root.createScene({
            name: 'GUIScene',
        });

        this._items = new CachedArray(64);
        this._bufferInitData = {
            vertexCount: 0,
            indiceCount: 0,
            attributes: vfmt,
        };
    }

    public initialize () {

        this._attributes = [
            { name: 'a_color', format: GFXFormat.RGBA32F, binding: 0, },
            { name: 'a_position', format: GFXFormat.RGB32F, binding: 1, },
            { name: 'a_texCoord', format: GFXFormat.RG32F, binding: 2, },
        ];

        this.createBufferBatch();

        this._cmdBuff = this._device.createCommandBuffer({
            allocator: this._device.commandAllocator,
            type: GFXCommandBufferType.PRIMARY,
        });

        return true;
    }

    public destroy () {

        for (const uiMaterial of this._uiMaterials) {
            uiMaterial.bindingLayout.destroy();
            uiMaterial.pipelineLayout.destroy();
            uiMaterial.pipelineState.destroy();
        }
        this._uiMaterials = [];

        for (const buffBatch of this._bufferBatches) {
            buffBatch.vb.destroy();
            buffBatch.ib.destroy();
        }
        this._bufferBatches = [];

        if (this._cmdBuff) {
            this._cmdBuff.destroy();
            this._cmdBuff = null;
        }
    }

    /*
    public registerMaterial (material: Material): IUIMaterial {
        const pass = material.passes[0];
        for (const mtrl of this._uiMaterials) {
            if (mtrl.pass === pass) {
                return mtrl;
            }
        }

        const bindingLayout = this._device.createBindingLayout({
            bindings: pass.bindings,
        });

        const pipelineLayout = this._device.createPipelineLayout({
            layouts: [bindingLayout],
        });

        const pipelineState = this._device.createPipelineState({
            primitive: pass.primitive,
            shader: pass.shader,
            is: { attributes: this._attributes },
            rs: pass.rasterizerState,
            dss: pass.depthStencilState,
            bs: pass.blendState,
            layout: pipelineLayout,
            renderPass: pass.renderPass,
        });

        const uiMaterial = {
            pass,
            bindingLayout,
            pipelineLayout,
            pipelineState,
        };

        this._uiMaterials.push(uiMaterial);

        return uiMaterial;
    }
    */

    public addScreen (comp) {
        this._screens.push(comp);
    }

    public getScreen (visibility: number) {
        for (const screen of this._screens) {
            if (screen.camera) {
                if (screen.camera.visibility === visibility) {
                    return screen;
                }
            }
        }

        return null;
    }

    public removeScreen (comp) {
        const idx = this._screens.indexOf(comp);
        if (idx !== -1) {
            this._screens.splice(idx, 1);
        }
    }

    public createBuffer (vertexCount: number, indiceCount: number) {
        const buffer = this._bufferPool.add();
        this._bufferInitData!.vertexCount = vertexCount;
        this._bufferInitData!.indiceCount = indiceCount;
        buffer.initialize(this._bufferInitData as IMeshBufferInitData);
        return buffer;
    }

    public createUIRenderData(){
        return this._commitUIRenderDataPool.add();
    }

    public addToQueue(uiRenderData: IUIRenderData){
        this._commitUIRenderDatas.push(uiRenderData);
    }

    public flush(){
        this.render();
    }

    public update (dt: number) {
        this._items.clear();

        // TODO: Merge batch here.
        this._renderScreens();

        // this.render();
        this.flush();
    }

    private _walk (node, fn1, fn2, level = 0) {
        level += 1;
        const len = node.children.length;
        fn1(node);
        for (let i = 0; i < len; ++i) {
            const child = node.children[i];
            this._walk(child, fn1, fn2, level);
        }

        fn2(node);
    }

    private _renderScreens () {
        this._reset();
        for (const screen of this._screens) {
            if (!screen.enabledInHierarchy) {
                continue;
            }
            // this._currScreen = screen;

            this._walk(screen.node, (c: BaseNode) => {
                const renderComponent = c.getComponent(UIRenderComponent);
                if (renderComponent && renderComponent.enabledInHierarchy) {
                    this._commitComp(renderComponent);
                }
            }, (c: BaseNode) => {
                    const renderComponent = c.getComponent(UIRenderComponent);
                    if (renderComponent && renderComponent.enabledInHierarchy) {
                        this._postCommitComp(renderComponent);
                    }
            });
        }
    }

    private _reset () {
        this._bufferPool.reset();
        this._commitUIRenderDataPool.reset();
    }

    private _commitComp (comp: UIRenderComponent) {
        comp.updateAssembler(this);
        // const canvasComp: CanvasComponent | null = this.getScreen(comp.viewID);

        // const renderDataFormat: IUIRenderData = this._commitUIRenderDataPool.add();
        // renderDataFormat.meshBuffer = buffer;
        // renderDataFormat.material = comp.material as Material;
        // renderDataFormat.camera = canvasComp!.camera!;
    }

    private _postCommitComp (comp: UIRenderComponent) {
        comp.postUpdateAssembler();
    }

    private render () {
        /*
        const framebuffer = this._root.curWindow!.framebuffer;
        const cmdBuff = this._cmdBuff!;

        cmdBuff.begin();
        cmdBuff.beginRenderPass(framebuffer, this._renderArea,
            [{r: 1, g: 1, b: 1, a: 1}], 1.0, 0);

        cmdBuff.end();

        this._device.queue.submit([cmdBuff]);
        */

        if (this._items.length) {
            const framebuffer = this._root.curWindow!.framebuffer;
            const cmdBuff = this._cmdBuff!;

            cmdBuff.begin();

            for (let i = 0; i < this._items.length; ++i) {
                const item = this._items.array[i];
                const camera = item.camera;

                this._renderArea.width = camera.width;
                this._renderArea.height = camera.height;

                cmdBuff.beginRenderPass(framebuffer, this._renderArea,
                    [camera.clearColor], camera.clearDepth, camera.clearStencil);

                cmdBuff.bindPipelineState(item.pipelineState);
                cmdBuff.bindBindingLayout(item.bindingLayout);
                cmdBuff.bindInputAssembler(item.inputAssembler);
                cmdBuff.draw(item.inputAssembler);

                cmdBuff.endRenderPass();
            }

            cmdBuff.end();

            this._device.queue.submit([cmdBuff]);
        }
    }

    private createBufferBatch (): IUIBufferBatch {

        const vbStride = Float32Array.BYTES_PER_ELEMENT * 6;

        const vb = this._device.createBuffer({
            usage: GFXBufferUsageBit.VERTEX | GFXBufferUsageBit.TRANSFER_DST,
            memUsage: GFXMemoryUsageBit.HOST | GFXMemoryUsageBit.DEVICE,
            size: vbStride * 128,
            stride: vbStride,
        });

        const ibStride = Uint16Array.BYTES_PER_ELEMENT;

        const ib = this._device.createBuffer({
            usage: GFXBufferUsageBit.INDEX | GFXBufferUsageBit.TRANSFER_DST,
            memUsage: GFXMemoryUsageBit.HOST | GFXMemoryUsageBit.DEVICE,
            size: ibStride * 128,
            stride: ibStride,
        });

        const ia = this._device.createInputAssembler({
            attributes: this._attributes,
            vertexBuffers: [vb],
            indexBuffer: ib,
        });

        const batch: IUIBufferBatch = { vb, ib };
        this._bufferBatches.push(batch);
        return batch;
    }
}
