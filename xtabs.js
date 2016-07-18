(function($){	
	var tabCounter = 0;
	var tabTemplate = '<li class="tab"> <input class="txt" type="text"> <a href="#{href}">#{title}</a> <span class="ui-icon ui-icon-close delete-tab">Remove Tab</span></li>';
	var baseHref = window.location.href.substr(0,window.location.href.length-window.location.hash.length);
		
	$.fn.xtabs = function(param){
		var $this = this;
		var config;
		var API = {
			getTabsOrder: function(){
				var tabsOrder = [];
				$this.find('>ul>li').each(function(){
					var data = $(this).data('tabx');
					if(data){
						var id = data.id;
						if(typeof(id)!='undefined'){
							tabsOrder.push(id);
						}
					}
				});
				return tabsOrder;
			},
			addTab: function(name,obj){
				if(!obj) obj = {};
				obj.name = name;
				obj.position = $this.find('>ul>li').length-1;
				return $this.data('xtab').writeTab(obj);
			}
		};
		var tabInitiliazed;
		var addingTab;
		var THIS = {
			attachEventToLi: function(newLi){
				newLi.on('dblclick','a',function(){
					 $(this).hide();
					 var input = $(this).siblings('input');
					 input.show();
					 input.val($(this).html());
					 input.focus();
				});
				newLi.on('keydown','input',function(e){				
				   var input = $(this);
				   if(e.which==13){
					   input.hide();
						var li = input.closest('li');
						var data = li.data('tabx');
						var val = input.val();
						if(config.renameTab){
							config.renameTab(val,data);
						}
						
					   $(this).siblings('a').show().html($(this).val());
				   }
				   if(e.which==38 || e.which==40 || e.which==37 || e.which==39 || e.keyCode == 32){
					   e.stopPropagation();
				   }
				});
				newLi.on('blur focusout','input',function(e){
					var input = $(this);
					var val = $(this).val();
					val = val.trim();
					var a = $(this).siblings('a');
					var li = input.closest('li');
					var data = li.data('tabx');
					var panelId = li.attr('aria-controls');
					var ok = function(){
						a.html(val);
						input.hide();
						a.show();
					};
					if(val){
						if(config.tabNameCheck){
							var check = config.tabNameCheck(val,input);
							if(typeof(check)=='object'&&check.done){
								check.done(function(result){
									if(result){
										if(config.renameTab){
											config.renameTab(val,data);
										}
										ok();
									}
									else{
										input.focus
									}
								});
							}
							else if(check&&check===true){
								if(config.renameTab){
									config.renameTab(val,data);
								}
								ok();
							}
							else{
								input.focus
							}
						}
						else{
							if(config.renameTab){
								config.renameTab(val,data);
							}
							ok();
						}
					}
					else{
						input.hide();
						a.show();
					}
				});
				newLi.on('click', '.delete-tab', function(){
					var li = $(this).closest('li');
					var panelId = li.attr('aria-controls');
					if(config.removeTab){
						config.removeTab(panelId,function(){
							THIS.removeTab(panelId);
						});
					}
					else{
						THIS.removeTab(panelId);
					}
				});
			},
			writeTab: function(tabObj,tmpTab){
				tabCounter++;
				var id = 'tabs-'+tabCounter;
				var newLi = $( tabTemplate.replace( /#\{href\}/g, baseHref+'#'+id ).replace( /#\{title\}/g, tabObj.name));
				var newDiv = $('<div id="'+id+'"></div>');
				
				newLi.data('tabx',tabObj);
				newDiv.data('tabx',tabObj);
				
				THIS.attachEventToLi(newLi);
				
				if(tmpTab){
					tmpTab.replaceWith(newLi);
				}
				else{
					$this.find('>ul >li:last').before(newLi);
				}
				$this.append(newDiv);
				
				if(config.tabContainerReady) config.tabContainerReady(newDiv);
				
				if(tabInitiliazed){
					$this.tabs('refresh');
					var active = $this.tabs('option','active');
					if(active===false||active===-1){
						$this.tabs('option', 'active', 0);
					}
				}
				
				var r;
				if(config.addedTab){
					r = config.addedTab(newDiv,newLi);
				}
				
				addingTab = false;
				
				return r;
			},
			addTab: function(name,tabObj,tmpTab){
				if(!tabObj){
					tabObj = {
						position	:	$this.find('>ul>li').length-1,
					};
				}
				tabObj.name = name;
				
				if(config.addTab){
					var addTabReturn = config.addTab(name,tabObj);
					if(typeof(addTabReturn)=='object'){
						if(typeof(addTabReturn.then)=='function'){
							addTabReturn.then(function(result){
								if(typeof(result)=='object')
									$.extend(tabObj,result);
								THIS.writeTab(tabObj,tmpTab);
							});
						}
						else{
							$.extend(tabObj,addTabReturn);
						}
					}
					else{
						THIS.writeTab(tabObj,tmpTab);
					}
				}
				else{
					THIS.writeTab(tabObj,tmpTab);
				}
				
			},
			removeTab: function(panelId){
				var li = $this.find('>ul>li[aria-controls="'+panelId+'"]');
				$this.find("#"+panelId).remove();
				li.remove();
				$this.tabs("refresh");
				$this.trigger('xtabsorder');
			},
			makeTabsSortable: function(){
				var sortableTabs = $this.find('>ul.ui-tabs-nav');
				sortableTabs.sortable({
					items: 'li:not(.fixed)',
					update: function(event, ui){
						$this.trigger('xtabsorder');
					},
					axis: 'x',
					stop: function(){
						$this.tabs('refresh');
					},
				});
				sortableTabs.on('click mousedown','input',function(e){
					e.stopImmediatePropagation();
				});
				sortableTabs.on('mousedown','.fixed',function(e){
					e.stopPropagation();
				});
			},
			addTempTab: function(){
				var id = 'tabs-'+(tabCounter+1);
				var newLi = $('<li class="tab ui-state-default ui-corner-top ui-tabs-active ui-state-active"> <input class="txt" type="text">  <span class="ui-icon ui-icon-close delete-tab">Remove Tab</span></li>');
				newLi.on('input','input',function(e){
					var input = $(this);
					var val = input.val();
					if(config.tabNameCheck){
						config.tabNameCheck(val,input);
					}
				});
				newLi.on('focusout keydown','input',function(e){
					if(e.type=='keydown'&&e.which!=13) return;
					var input = $(this);
					var val = input.val();
					val = val.trim();
					if(!val){
						newLi.remove();
						addingTab = false;
					}
					else{
						if(config.tabNameCheck){
							var check = config.tabNameCheck(val,input);
							if(typeof(check)=='object'&&check.done){
								check.done(function(isValid){
									if(isValid){
										THIS.addTab(val,null,newLi);
									}
									else{
										$(this).focus();
									}
								});
							}
							else if(check&&check===true){
								THIS.addTab(val,null,newLi);
							}
						}
						else{
							THIS.addTab(val,null,newLi);
						}
					}
				});
				
				$this.find('ul:first >li:last').before(newLi);
				
				var li = $this.find('>ul >li:last').prev();
				var input = li.find('input');
				li.find('a').hide();
				input.show();
				input.focus();
			},
			
		};
		
		if(typeof(param)=='string'){
			var params = [];
			Array.prototype.push.apply(params, arguments);
			params.shift();
			if(!API[param]&&console){
				console.exception('xtabs call to undefined method : '+param);
				return;
			}
			else{
				return API[param].apply(this,params);
			}
		}
		else{
			config = param;
		}
		
		if(!config) config = {};
		$.extend(true,config,{
			tabs:{},
			buildTabs:[]
		});
		if(config.onOrder) $this.on('xtabsorder',config.onOrder);
		
		return this.each(function(){
			var $this = $(this);
			
			$this.data('xtab',THIS);
			
			var ul = $this.find('>ul');
			if(!ul.length) ul = $('<ul/>').appendTo($this);
			
			//fix <base> tag
			ul.find('a').each(function(){
				var href = $(this).attr('href');
				if(typeof(href)=='string'&&href.indexOf('#')==0){
					$(this).attr('href', window.location.href.substr(0,window.location.href.length-window.location.hash.length) + href );
				}
			});
			
			ul.append('<li class="fixed"><a class="add-tab"><i class="fa fa-plus"></i></a></li>');
			
			for(var i = 0, l = config.buildTabs.length;i<l;i++){
				THIS.writeTab(config.buildTabs[i]);
			}
			
			$this.tabs(config.tabs);
			
			THIS.makeTabsSortable();
			
			tabInitiliazed = true;

			$this.find('.add-tab').click(function(){
				if(!addingTab){
					addingTab = true;
					THIS.addTempTab();
				}
			});
			
		});
	};
})(jQuery);