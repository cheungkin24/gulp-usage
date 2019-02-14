var href = window.location.href.split('/')
var currentHref = href.pop().split('.')[0]
this.require.modules[currentHref]()