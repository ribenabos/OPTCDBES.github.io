(function() {

var directives = { };
var filters = { };

var app = angular.module('optc');

/**************
 * Directives *
 **************/

directives.characterTable = function($rootScope, $timeout, $compile, $storage) {
    return {
        restrict: 'E',
        replace: true,
        template: '<table id="mainTable" class="table table-striped-column panel panel-default"></table>',
        link: function(scope, element, attrs) {
            var table = element.dataTable({
                iDisplayLength: $storage.get('unitsPerPage', 10),
                stateSave: true,
                data: scope.table.data,
                columns: scope.table.columns,
                rowCallback: function(row, data, index) {
                    if (!row || row.hasAttribute('loaded')) return;
                    var $row = $(row);
                    if (!$row) return;
                    // lazy thumbnails
                    $row.find('[data-original]').each(function(n,x) {
                        x.setAttribute('src',x.getAttribute('data-original'));
                        x.removeAttribute('data-original');
                    });
                    // character log checkbox
                    var id = data[data.length - 1] + 1;
                    var checkbox = $('<label><input type="checkbox" ng-change="checkLog(' + id + ')" ng-model="characterLog[' + id + ']"></input></label>');
                    $(row.cells[10 + scope.table.additional]).append(checkbox);
                    // cosmetic fixes
                    //$(row.cells[1]).addClass('cell-imgtext');
                    $(row.cells[2]).wrapInner( "<div></div>" ).addClass('cell-' + row.cells[2].textContent);
                    var n = row.cells.length - 2 - scope.table.additional;
					$(row.cells[n]).addClass('starsx-' + row.cells[n].textContent);
					$(row.cells[n]).wrapInner( "<div></div>" )
                    //$(row.cells[n]).wrap("<img src='./img/" + row.cells[n].textContent  + "estrellas.png'>");
					row.cells[n].textContent = '';
                    // compile
                    $compile($(row).contents())($rootScope);
                    if (window.units[id - 1].preview) $(row).addClass('preview');
                    else if (window.units[id - 1].incomplete) $(row).addClass('incomplete');
                    row.setAttribute('loaded','true');
                },
                headerCallback : function(header) {
                    if (header.hasAttribute('loaded')) return;
                    header.cells[header.cells.length - 1].setAttribute('title', 'Character Log');
                    header.setAttribute('loaded',true);
                }
            });
            scope.table.refresh = function() {
                $rootScope.$emit('table.refresh');
                $timeout(function() { element.fnDraw(); });
            };
            // report link
            var link = $('<span class="help-link">??Quieres informar o solicitar algo? Utilice <a> este correo</a>.</span>');
            link.find('a').attr('href', 'mailto:sonrics123@gmail.com');
            link.insertAfter($('.dataTables_length'));
            // pick column link
            var pick = $('<a id="pick-link" popover-placement="bottom" popover-trigger="click" popover-title="Columnas Adicionales" ' +
                'uib-popover-template="\'views/pick.html\'" popover-append-to-body="\'true\'">Columnas Adicionales</a>');
            $compile(pick)(scope);
            pick.insertAfter($('.dataTables_length'));
            // night toggle
            var nightToggle = $('<label class="night-toggle"><input type="checkbox">Modo Oscuro</input></label>');
            nightToggle.find('input').change(function(e) {
                $rootScope.nightMode = e.target.checked;
                if (!$rootScope.$$phase) $rootScope.$apply();
            });
            if ($rootScope.nightMode) nightToggle.find('input').attr('checked', 'checked');
            nightToggle.insertBefore($('.dataTables_length'));
            // fuzzy toggle
            var fuzzyToggle = $('<label class="fuzzy-toggle"><input type="checkbox">Habilitar b??squeda especial</input></label>');
            fuzzyToggle.attr('title','Cuando est?? activado, las b??squedas tambi??n mostrar??n unidades cuyo nombre no coincida exactamente con las palabras claves de b??squeda. \nEs ??til si no sabe la forma correcta de escribir una cierta unidad.');
            fuzzyToggle.find('input').prop('checked', scope.table.fuzzy);
            fuzzyToggle.find('input').change(function() {
                var checked = $(this).is(':checked');
                if (checked == scope.table.fuzzy) return;
                scope.table.fuzzy = checked;
                $storage.set('fuzzy', scope.table.fuzzy);
                scope.table.refresh();
            });
            fuzzyToggle.insertBefore($('.dataTables_length'));
        }
    };
};

directives.decorateSlot = function() {
    return {
        restrict: 'A',
        scope: { uid: '=', big: '@' },
        link: function(scope, element, attrs) {
            if (scope.big)
                element[0].style.backgroundImage = 'url(' + Utils.getBigThumbnailUrl(scope.uid) + ')';
            else
                element[0].style.backgroundImage = 'url(' + Utils.getThumbnailUrl(scope.uid) + ')';
        }
    };
};

directives.autoFocus = function($timeout) {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			$timeout(function(){ element[0].focus(); });
		}
	};
};

directives.addCaptainOptions = function($timeout, $compile, MATCHER_IDS) {
    var TARGET = MATCHER_IDS['captain.ClassBoostingCaptains'];
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            if (scope.n !== TARGET) return;
            var filter = $('<div id="class-filters" ng-class="{ enabled: filters.custom[' + TARGET + '] }"></div>');
            var classes = [ 'Fighter', 'Shooter', 'Slasher', 'Striker', 'Free Spirit', 'Cerebral', 'Powerhouse', 'Driven' ];
            classes.forEach(function(x,n) {
                var template = '<span class="filter subclass %c" ng-class="{ active: filters.classCaptain == \'%s\' }" ' +
                    'ng-click="onCaptainClick($event,\'%s\')">%s</span>';
                filter.append($(template.replace(/%s/g,x).replace(/%c/,'width-6')));
            });
            element.after(filter);
            $compile(filter)(scope);
            scope.onCaptainClick = function(e,type) {
                scope.filters.classCaptain = (scope.filters.classCaptain == type ? null : type);
            };
        }
    };
};

directives.addSpecialOptions = function($timeout, $compile, MATCHER_IDS) {
    var TARGET = MATCHER_IDS['special.ClassBoostingSpecials'];
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            if (scope.n !== TARGET) return;
            var filter = $('<div id="class-filters" ng-class="{ enabled: filters.custom[' + TARGET + '] }"></div>');
            var classes = [ 'Fighter', 'Shooter', 'Slasher', 'Striker', 'Free Spirit', 'Cerebral', 'Powerhouse', 'Driven' ];
            classes.forEach(function(x,n) {
                var template = '<span class="filter subclass %c" ng-class="{ active: filters.classSpecial == \'%s\' }" ' +
                    'ng-click="onSpecialClick($event,\'%s\')">%s</span>';
                filter.append($(template.replace(/%s/g,x).replace(/%c/,'width-6')));
            });
            element.after(filter);
            $compile(filter)(scope);
            scope.onSpecialClick = function(e,type) {
                scope.filters.classSpecial = (scope.filters.classSpecial == type ? null : type);
            };
        }
    };
};

directives.addOrbOptions = function($timeout, $compile, MATCHER_IDS) {
    var TARGET = MATCHER_IDS['special.OrbControllers'];
    return {
        restrict: 'A',
        link: function(scope,element,attrs) {
            if (scope.n !== TARGET) return;
            var orbs = { ctrlFrom: [ ], ctrlTo: [ ] };
            var filter = $('<div id="controllers" ng-class="{ enabled: filters.custom[' + TARGET + '] }">' +
                    '<span class="separator">&darr;</span></div>');
            var separator = filter.find('.separator');
            [ 'STR', 'DEX', 'QCK', 'PSY', 'INT', 'RCV', 'TND', 'NEGATIVO', 'VACIO', 'BOMBA', 'G' ].forEach(function(type) {
                var template = '<span class="filter orb %s" ng-class="{ active: filters.%f.indexOf(\'%s\') > -1 }" ' +
                    'ng-model="filters.%f" ng-click="onOrbClick($event,\'%s\')">%S</span>';
                separator.before($(template.replace(/%s/g,type).replace(/%S/g,type[0]).replace(/%f/g,'ctrlFrom')));
                filter.append($(template.replace(/%s/g,type).replace(/%S/g,type[0]).replace(/%f/g,'ctrlTo')));
            });
            element.after(filter);
            $compile(filter)(scope);
            scope.onOrbClick = function(e,type) {
                var target = e.target.getAttribute('ng-model');
                if (!target) return;
                target = target.match(/filters\.(.+)$/)[1];
                if (orbs[target].indexOf(type) == -1) orbs[target].push(type);
                else orbs[target].splice(orbs[target].indexOf(type), 1);
                orbs[target] = orbs[target].slice(-2);
                scope.filters[target] = orbs[target];
            };
        }
    };
};

directives.goBack = function($state) {
	return {
		restrict: 'A',
        link: function(scope, element, attrs) {
            element.click(function(e) {
                if (!e.target || e.target.className.indexOf('inner-container') == -1) return;
                element.find('.modal-content').addClass('rollOut');
                $('.backdrop').addClass('closing');
                setTimeout(function() { $state.go('^'); },300);
            });
        }
    };
};

directives.evolution = function($state, $stateParams) {
    return {
        restrict: 'E',
        replace: true,
        scope: { unit: '=', base: '=', evolvers: '=', evolution: '=', size: '@' },
        templateUrl: 'views/evolution.html',
        link: function(scope, element, attrs) {
            scope.goToState = function(id) {
                if (id == parseInt($stateParams.id,10)) return;
                var previous = $stateParams.previous.concat([ $stateParams.id ]);
                $state.go('main.search.view',{ id: id, previous: previous });
            };
        }
    };
};

directives.unit = function($state, $stateParams) {
    return {
        restrict: 'E',
        scope: { uid: '=' },
        template: '<a class="slot medium" decorate-slot uid="uid" ng-click="goToState(uid)"></a>',
        link: function(scope, element, attrs) {
            scope.goToState = function(id) {
                if (id == parseInt($stateParams.id,10)) return;
                var previous = $stateParams.previous.concat([ $stateParams.id ]);
                $state.go('main.search.view',{ id: id, previous: previous });
            };
        }
    };

};

directives.compare = function() {
    var fuse = new Fuse(window.units, { keys: [ 'name' ], id: 'number' });
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {

            var target = element.typeahead(
                { minLength: 3, highlight: true },
                {
                    source: function(query, callback) { callback(fuse.search(query)); },
                    templates: {
                        suggestion: function(id) {
                            if (Number.isInteger(id)){
                                var name = units[id].name, url = Utils.getThumbnailUrl(id+1);
                                if (name.length > 63) name = name.slice(0,60) + '...';
                                var thumb = '<div class="slot small" style="background-image: url(' + url + ')"></div>';
                                return '<div><div class="suggestion-container">' + thumb + '<span>' + name + '</span></div></div>';
                            }
                            else{
                                var name = 'material', url = Utils.getThumbnailUrl(id);
                                var thumb = '<div class="slot small" style="background-image: url(' + url + ')"></div>';
                                return '<div><div class="suggestion-container">' + thumb + '<span>' + name + '</span></div></div>';
                   }
                        }
                    },
                    display: function(id) {
                        return units[id].name;
                    }
                }
            );

            target.bind('typeahead:select',function(e,suggestion) {
                $(e.currentTarget).prop('disabled', true);
                scope.compare = window.units[suggestion];
                scope.compareDetails = window.details[suggestion + 1];
                scope.compareCooldown = window.cooldowns[suggestion];
                scope.isCompareCaptainHybrid = (scope.compareDetails && scope.compareDetails.captain &&
                    scope.compareDetails.captain.global);
				scope.isCompareSailorHybrid = (scope.compareDetails && scope.compareDetails.sailor &&
                    scope.compareDetails.sailor.global);
                scope.isCompareSpecialHybrid = (scope.compareDetails && scope.compareDetails.special &&
                    scope.compareDetails.special.global);
                scope.isCompareSpecialStaged = (scope.compareDetails && scope.compareDetails.special &&
                    scope.compareDetails.special.constructor == Array);
                if (!scope.$$phase) scope.$apply();
            });

            element[0].style.backgroundColor = null;

        }
    };
};

directives.comparison = function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var positive = (attrs.comparison == 'positive');
            var watch = scope.$watch(
                function() { return element.html(); },
                function() {
                    var isNegative = parseFloat(element.text(),10) < 0;
                    element.removeClass('positive negative withPlus');
                    if ((positive && !isNegative) || (!positive && isNegative)) element.addClass('positive');
                    else element.addClass('negative');
                    if (!isNegative) element.addClass('withPlus');
                }
            );
            scope.$on('$destroy',watch);
        }
    };
};

directives.addTags = function($stateParams, $rootScope) {
    return {
        restrict: 'E',
        replace: true,
        template: '<div class="tag-container"></div>',
        link: function(scope, element, attrs) {
            var id = $stateParams.id, data = details[id];
            // flags
            var flags = window.flags[id] || { };
            element.append($('<span class="tag flag">' + (flags.global ? 'Unidad Global' : 'Unidad Japonesa') + '</div>'));
            element.append($('<span class="tag flag">' +
                        (CharUtils.isFarmable(id) ? 'Farmeable' : 'No-farmeable') + '</div>'));
            if (flags.rr) element.append($('<span class="tag flag">S??lo Rare Recruit</div>'));
            if (flags.lrr) element.append($('<span class="tag flag">Limitado S??lo Rare Recruit</div>'));
            if (flags.promo) element.append($('<span class="tag flag">S??lo por C??digo Promocional</div>'));
			if (flags.shop) element.append($('<span class="tag flag">Unidades Tienda Ray</div>'));
            if (flags.special) element.append($('<span class="tag flag">Personajes Limitados</div>'));
            if (CharUtils.checkFarmable(id, { 'Story Island': true }))
                element.append($('<span class="tag flag">S??lo en Modo Historia</div>'));
            if (CharUtils.checkFarmable(id, { Quincenal: true }))
                element.append($('<span class="tag flag">S??lo Quincenales</div>'));
            if (CharUtils.checkFarmable(id, { Raid: true }))
                element.append($('<span class="tag flag">S??lo Raid</div>'));
            if (CharUtils.checkFarmable(id, { 'Story Island': true, Quincenal: true }))
                element.append($('<span class="tag flag">S??lo en Modo Historia y Quincenales</div>'));
            if (CharUtils.checkFarmable(id, { Raid: true, Quincenal: true }))
                element.append($('<span class="tag flag">S??lo Raid y Quincenales</div>'));
            // matchers
            if (!data) return;
            matchers.forEach(function(matcher) {
                var name;
                // captain effects
                if (matcher.target == 'captain' && matcher.matcher.test(data.captain)) {
                    name = matcher.name;
                    if (!/captains$/.test(name)) name = name.replace(/ers$/,'ing').replace(/s$/,'') + ' - Capit??n';
                    else name = name.replace(/s$/,'');
                    name = name.replace(/iing/,'ying');
                    element.append($('<span class="tag captain">' + name + '</div>'));
                }
				// sailor effects
                if (matcher.target.indexOf('sailor') === 0 && matcher.matcher.test(data[matcher.target]) && !(data[matcher.target] === undefined)) {
                    name = matcher.name;
                    /*if (!/sailor$/.test(name)) name = name.replace(/ers$/,'ing').replace(/s$/,'') + ' - Sailor';
                    else name = name.replace(/s$/,'');
                    name = name.replace(/iing/,'ying');*/
                    element.append($('<span class="tag sailor">' + name + '</div>'));
                }
                // specials
                if (matcher.target.indexOf('special') === 0 && matcher.matcher.test(data[matcher.target])) {
                    name = matcher.name;
                    if (!/specials$/.test(name)) name = name.replace(/ers$/,'ing').replace(/s$/,'') + ' - Especial';
                    else name = name.replace(/s$/,'');
                    name = name.replace(/iing/,'ying');
                    element.append($('<span class="tag special">' + name + '</div>'));
                }
            });
        }
    };
};

directives.addLinks = function($stateParams) {
    return {
        restrict: 'E',
        replace: true,
        template: '<div class="link-container"></div>',
        link: function(scope, element, attrs) {
            var id = parseInt($stateParams.id,10), data = details[id];
            if (!units[id - 1]) return;
            var incomplete = units[id - 1].incomplete;
            var ul = $('<ul></ul>');
            if (!incomplete && window.flags[id] && window.flags[id].global) {
                var link = 'http://onepiece-treasurecruise.com/en/' + (id == '5' ? 'roronoa-zoro' : 'c-' + id);
                ul.append($('<li><a href="' + link + '" target="_blank">Official Guide (English)</a></li>'));
            }
            if (!incomplete) {
                ul.append($('<li><a href="http://onepiece-treasurecruise.com/c-' + id + '" target="_blank">' +
                        'Gu??a Oficial (Japonesa)</a></li>'));
            }
            if (!isNaN(gw[id-1])) {
                ul.append($('<li><a href="http://xn--pck6bvfc.gamewith.jp/article/show/' + gw[id-1] + '" target="_blank">' +
                        'P??gina GameWith (Japonesa)</a></li>'));
            }
            if (ul.children().length > 0)
                element.append(ul);
        }
    };
};

directives.costSlider = function($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.ionRangeSlider({
                grid: true,
                type: 'double',
                min: scope.filters.cost[0],
                max: scope.filters.cost[1],
                from: scope.filters.cost[0],
                to: scope.filters.cost[1],
                postfix: ' coste',
                onFinish: function(data) {
                    scope.filters.cost[0] = data.from;
                    scope.filters.cost[1] = data.to;
                    if (!scope.$$phase) scope.$apply();
                }
            });
        }
    };
};

/******************
 * Initialization *
 ******************/

for (var directive in directives)
    app.directive(directive, directives[directive]);

for (var filter in filters)
    app.filter(filter, filters[filter]);

})();
