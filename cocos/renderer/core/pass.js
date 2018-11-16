// Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

import gfx from '../gfx';

let PassStage = cc.Enum({
    DEFAULT: 0,
    FORWARD: 1,
    SHADOW_CAST: 2
});

PassStage.parseStage = function (name) {
    switch (name) {
        case 'default':
            return this.DEFAULT;
        case 'forward':
            return this.FORWARD;
        case 'shadowcast':
            return this.SHADOW_CAST;
    }
};

cc.PassStage = PassStage;

export default class Pass {
  constructor(stage, name) {
    this._stage = PassStage.parseStage(stage);
    this._programName = name;

    this._stage = null;

    // cullmode
    this._cullMode = gfx.CULL_BACK;

    // blending
    this._blend = false;
    this._blendEq = gfx.BLEND_FUNC_ADD;
    this._blendAlphaEq = gfx.BLEND_FUNC_ADD;
    this._blendSrc = gfx.BLEND_ONE;
    this._blendDst = gfx.BLEND_ZERO;
    this._blendSrcAlpha = gfx.BLEND_ONE;
    this._blendDstAlpha = gfx.BLEND_ZERO;
    this._blendColor = 0xffffffff;

    // depth
    this._depthTest = false;
    this._depthWrite = false;
    this._depthFunc = gfx.DS_FUNC_LESS,

    // stencil
    this._stencilTest = false;
    // front
    this._stencilFuncFront = gfx.DS_FUNC_ALWAYS;
    this._stencilRefFront = 0;
    this._stencilMaskFront = 0xff;
    this._stencilFailOpFront = gfx.STENCIL_OP_KEEP;
    this._stencilZFailOpFront = gfx.STENCIL_OP_KEEP;
    this._stencilZPassOpFront = gfx.STENCIL_OP_KEEP;
    this._stencilWriteMaskFront = 0xff;
    // back
    this._stencilFuncBack = gfx.DS_FUNC_ALWAYS;
    this._stencilRefBack = 0;
    this._stencilMaskBack = 0xff;
    this._stencilFailOpBack = gfx.STENCIL_OP_KEEP;
    this._stencilZFailOpBack = gfx.STENCIL_OP_KEEP;
    this._stencilZPassOpBack = gfx.STENCIL_OP_KEEP;
    this._stencilWriteMaskBack = 0xff;
  }

  setStage(stage) {
    this._stage = stage;
  }

  setCullMode(cullMode = gfx.CULL_BACK) {
    this._cullMode = cullMode;
  }

  setBlend(
    enabled = false,
    blendEq = gfx.BLEND_FUNC_ADD,
    blendSrc = gfx.BLEND_ONE,
    blendDst = gfx.BLEND_ZERO,
    blendAlphaEq = gfx.BLEND_FUNC_ADD,
    blendSrcAlpha = gfx.BLEND_ONE,
    blendDstAlpha = gfx.BLEND_ZERO,
    blendColor = 0xffffffff
  ) {
    this._blend = enabled;
    this._blendEq = blendEq;
    this._blendSrc = blendSrc;
    this._blendDst = blendDst;
    this._blendAlphaEq = blendAlphaEq;
    this._blendSrcAlpha = blendSrcAlpha;
    this._blendDstAlpha = blendDstAlpha;
    this._blendColor = blendColor;
  }

  setDepth(
    depthTest = false,
    depthWrite = false,
    depthFunc = gfx.DS_FUNC_LESS
  ) {
    this._depthTest = depthTest;
    this._depthWrite = depthWrite;
    this._depthFunc = depthFunc;
  }

  setStencilFront(
    enabled = false,
    stencilFunc = gfx.DS_FUNC_ALWAYS,
    stencilRef = 0,
    stencilMask = 0xff,
    stencilFailOp = gfx.STENCIL_OP_KEEP,
    stencilZFailOp = gfx.STENCIL_OP_KEEP,
    stencilZPassOp = gfx.STENCIL_OP_KEEP,
    stencilWriteMask = 0xff
  ) {
    this._stencilTest = enabled;
    this._stencilFuncFront = stencilFunc;
    this._stencilRefFront = stencilRef;
    this._stencilMaskFront = stencilMask;
    this._stencilFailOpFront = stencilFailOp;
    this._stencilZFailOpFront = stencilZFailOp;
    this._stencilZPassOpFront = stencilZPassOp;
    this._stencilWriteMaskFront = stencilWriteMask;
  }

  setStencilBack(
    enabled = false,
    stencilFunc = gfx.DS_FUNC_ALWAYS,
    stencilRef = 0,
    stencilMask = 0xff,
    stencilFailOp = gfx.STENCIL_OP_KEEP,
    stencilZFailOp = gfx.STENCIL_OP_KEEP,
    stencilZPassOp = gfx.STENCIL_OP_KEEP,
    stencilWriteMask = 0xff
  ) {
    this._stencilTest = enabled;
    this._stencilFuncBack = stencilFunc;
    this._stencilRefBack = stencilRef;
    this._stencilMaskBack = stencilMask;
    this._stencilFailOpBack = stencilFailOp;
    this._stencilZFailOpBack = stencilZFailOp;
    this._stencilZPassOpBack = stencilZPassOp;
    this._stencilWriteMaskBack = stencilWriteMask;
  }
}
