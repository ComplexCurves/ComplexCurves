all: ComplexCurves

beautify:
	js-beautify --max-preserve-newlines 3 --end-with-newline -r -f src/js/*.js

clean:
	$(RM) -r build

.PHONY: all beautify clean

se_mods = API Assembly CachedSurface Complex ComplexCurves Export GLSL Initial \
	Matrix Mesh Misc Monomial Parser Polynomial PolynomialParser Quaternion \
	Stage State3D StateGL Subdivision SubdivisionPre Surface Term Tokenizer
se_srcs = build/resources.js $(se_mods:%=src/js/%.js)

JAVA=java
CLOSURE=$(JAVA) -jar compiler.jar
se_closure_level = ADVANCED
se_closure_warnings = VERBOSE
se_closure_args = \
	--language_in ECMASCRIPT6_STRICT \
	--language_out ECMASCRIPT5_STRICT \
	--dependency_mode LOOSE \
	--create_source_map build/ComplexCurves.js.map \
	--compilation_level $(se_closure_level) \
	--warning_level $(se_closure_warnings) \
 	--jscomp_warning=reportUnknownTypes \
	--source_map_format V3 \
	--source_map_location_mapping "build/|" \
	--source_map_location_mapping "src/js/|../src/js/" \
	--output_wrapper_file src/js/ComplexCurves.js.wrapper \
	--summary_detail_level 3 \
	--js_output_file $@ \
	$(se_extra_args) \
	--js $(se_srcs)
se_dbg_args = --formatting PRETTY_PRINT

build/resources.js: $(wildcard src/glsl/*)
	mkdir -p $(@D)
	echo "var resources = {};" > $@
	for i in src/glsl/*; do \
		echo "resources['$$(basename $$i)'] = \`" >> $@; \
		sed -e 's/ \+/ /g;s/^ //g' $$i >> $@; \
		echo '`;' >> $@; \
		done

build/ComplexCurves.js: compiler.jar $(se_srcs) src/js/ComplexCurves.js.wrapper
	$(CLOSURE) $(se_closure_args)

CLOSURE_VERSION=20160517

compiler.jar:
	wget http://dl.google.com/closure-compiler/compiler-$(CLOSURE_VERSION).zip
	unzip compiler-$(CLOSURE_VERSION).zip compiler.jar
	rm compiler-$(CLOSURE_VERSION).zip

ComplexCurves: build/ComplexCurves.js

ComplexCurves-dbg:
	$(RM) build/ComplexCurves.js
	$(MAKE) se_extra_args='$(se_dbg_args)' se_closure_level='WHITESPACE_ONLY' build/ComplexCurves.js

.PHONY: ComplexCurves
