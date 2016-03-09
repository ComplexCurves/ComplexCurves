import {
    SingularityExplorer,
    SingularityExplorerFromEquation,
    SingularityExplorerFromFile
}
from 'src/js/SingularityExplorer';
window['SingularityExplorer'] = SingularityExplorer;
SingularityExplorer['fromEquation'] = SingularityExplorerFromEquation;
SingularityExplorer['fromFile'] = SingularityExplorerFromFile;
SingularityExplorer.prototype['rotateFront'] = SingularityExplorer.prototype.rotateFront;
SingularityExplorer.prototype['rotateLatLong'] = SingularityExplorer.prototype.rotateLatLong;
SingularityExplorer.prototype['rotateRight'] = SingularityExplorer.prototype.rotateRight;
SingularityExplorer.prototype['rotateTop'] = SingularityExplorer.prototype.rotateTop;
SingularityExplorer.prototype['setAntialiasing'] = SingularityExplorer.prototype.setAntialiasing;
SingularityExplorer.prototype['setClipping'] = SingularityExplorer.prototype.setClipping;
SingularityExplorer.prototype['setLatLong'] = SingularityExplorer.prototype.setLatLong;
SingularityExplorer.prototype['setOrtho'] = SingularityExplorer.prototype.setOrtho;
SingularityExplorer.prototype['setTransparency'] = SingularityExplorer.prototype.setTransparency;
SingularityExplorer.prototype['toggleAntialiasing'] = SingularityExplorer.prototype.toggleAntialiasing;
SingularityExplorer.prototype['toggleClipping'] = SingularityExplorer.prototype.toggleClipping;
SingularityExplorer.prototype['toggleOrtho'] = SingularityExplorer.prototype.toggleOrtho;
SingularityExplorer.prototype['toggleTransparency'] = SingularityExplorer.prototype.toggleTransparency;
