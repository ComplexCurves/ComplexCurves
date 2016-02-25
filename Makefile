all: SingularityExplorer

beautify:
	js-beautify --max-preserve-newlines 3 --end-with-newline -r -f src/*.js

clean:
	$(RM) -r build

.PHONY: all beautify clean

se_mods = Assembly CachedSurface Complex GLSL Initial Matrix \
	Misc Monomial Parser Polynomial PolynomialParser Quaternion \
	SingularityExplorer Stage State3D StateGL Subdivision SubdivisionPre \
	Surface Term Tokenizer
se_srcs = $(se_mods:%=src/%.js) build/resources.js

JAVA=java
CLOSURE=$(JAVA) -jar compiler.jar
se_closure_level = ADVANCED
se_closure_warnings = VERBOSE
se_closure_args = \
	--language_in ECMASCRIPT6_STRICT \
	--language_out ECMASCRIPT5_STRICT \
	--dependency_mode LOOSE \
	--create_source_map build/SingularityExplorer.js.map \
	--compilation_level $(se_closure_level) \
	--warning_level $(se_closure_warnings) \
	--source_map_format V3 \
	--source_map_location_mapping "build/|" \
	--source_map_location_mapping "src/|../src/" \
	--output_wrapper_file src/SingularityExplorer.js.wrapper \
	--summary_detail_level 3 \
	--js_output_file $@ \
	$(se_extra_args) \
	--js $(se_srcs)
se_dbg_args = --formatting PRETTY_PRINT

build/resources.js: $(wildcard shaders/*)
	mkdir -p $(@D)
	echo "var resources = {};" > $@
	for i in shaders/*; do \
		echo "resources['$$(basename $$i)'] = \`" >> $@; \
		sed -e 's/ \+/ /g;s/^ //g' $$i >> $@; \
		echo '`;' >> $@; \
		done

build/SingularityExplorer.js: compiler.jar $(se_srcs)
	$(CLOSURE) $(se_closure_args)

CLOSURE_VERSION=20160208

compiler.jar:
	wget http://dl.google.com/closure-compiler/compiler-$(CLOSURE_VERSION).zip
	unzip compiler-$(CLOSURE_VERSION).zip compiler.jar
	rm compiler-$(CLOSURE_VERSION).zip

SingularityExplorer: build/SingularityExplorer.js

SingularityExplorer-dbg:
	$(RM) build/SingularityExplorer.js
	$(MAKE) se_extra_args='$(se_dbg_args)' se_closure_level='WHITESPACE_ONLY' build/SingularityExplorer.js

.PHONY: SingularityExplorer
