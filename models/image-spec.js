/**
 * Created by noa on 15/04/17.
 */
'use strict';
var expect = require('chai').expect;
var _ = require('lodash');

var base64EncodedImageContents = 'iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAMAAAAM7l6QAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAACcFBMVEUAAACXJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB/////0TRaIAAAAznRSTlMAAAYoRFBKMw894vf7+fJ+ZK4EBQIBIarcQgUABQESlIw9adr+7pQ3bao3AoL98vj98PzAGDvq/nsDnP3SiWd4uPbZICHe/JwcCmfs/V0PlPi3EgF2/cUvCIf/+VQc18MgXP7mJwSupwJe/uQkA6qpAgFz/vZHFM62EQh07aQJYPn7px4k4fd9DAJI3v1hB6z4tGJCUZTq4ypL8/33+/+PAgea/P3/+//TJR+0sWCM7vq1WpTLTRAJBT2/5mIQAxMDarQGR/ONDEZpd3BWHo3mDFUAAAABYktHRM+D3sJpAAAAB3RJTUUH4QQdEwoufmazaQAAAYVJREFUKM9jYKAPYGRiZmFlY+dgZMQuzcnFzcPLx49LWuAcCAgKoUszMgqLMIqKiYOlJSSlGKVlZJHUMMrJKygqKauApc+pqqlraGohrGDU1tE9p6d/DgYMDI3OGZswwo02NTuHDswtYNoZLa0gQtY2tnb2Do4QjpMzTNrFFSzg5u7ByMjo6eUN5vn4wqT9/ANAAoFBIAHG4JBQEC8sHG55RGTUuXPRMRDbGGPjgLLxCUhOT0w6dy45BcJnTE0DSqdnIDzOmJl17lx2DlQ6Nw8onV+A0FxYVHzuXEkp1PCycqB0RSXcY1XVNSDH1NaBncZY3wDkNDY1w6RbWsFeaWvvAHqss6sbzOvphUn39UNCYsLESZOnTJ0G4UyfAZNmnDkLGpSz58ydB2XOXwD398JF584tXgIP76XLlp9bsRLhcsZVq9esXbceKrth46bNW7YipRlGxm3bGXfs3AWW3b1nL+O+/Qcwk8xBsPShwzjS2pGjIOljuJLi8RMnT50+cxaHNPUBAKaI25/rA/PEAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE3LTA0LTI5VDE5OjEwOjQ2KzAyOjAwaQg1YQAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxNy0wNC0yOVQxOToxMDo0NiswMjowMBhVjd0AAAAASUVORK5CYII='

describe('Image', function () {
    it('should be an existing model', function () {
        var Image = require('./image.js');
        expect(Image).to.exist;
    });

    it('should fail on creation of image without required fields', function () {
        var Image = require('./image.js');
        var error = new Image().validateSync();
        expect(_.isEqual(_.keys(error.errors).sort(), ['image_id', 'format', 'contents'].sort())).to.be.true;
    });

    it('should succeed on creation of image with only required fields', function () {
        var Image = require('./image.js');
        var image = new Image({ image_id: 'myimage.png', format: 'png', contents: base64EncodedImageContents });
        expect(image.validateSync()).to.be.undefined;
    });

    // TODO
    // it('should fail on creation of two images with same image_id', function() {
    // });

    it('should have default basic properties for image created with only required fields', function () {
        var Image = require('./image.js');
        var image = new Image({ image_id: 'myimage.png', format: 'png', contents: base64EncodedImageContents });
        expect(image.hidden).to.be.false;
        expect(image.creation_date).to.exist;
    });

    it('should fail on creation of image with invalid base64-encoded contents', function () {
        var Image = require('./image.js');
        var error = new Image({ image_id: 'myimage.png', format: 'png', contents: '@@@@@' }).validateSync();
        expect(_.isEqual(_.keys(error.errors).sort(), ['contents'].sort())).to.be.true;
    });
});
