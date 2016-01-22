all: SingularityExplorer

beautify:
	js-beautify --max-preserve-newlines 3 --end-with-newline -r -f *.js

clean:
	$(RM) -r build

.PHONY: all beautify clean

se_mods = Assembly CachedSurface Complex GLSL Initial Matrix Misc Polynomial \
	PolynomialParser Quaternion Schedule SingularityExplorer Stage State3D \
	StateGL Subdivision SubdivisionPre Surface
se_srcs = $(se_mods:%=%.js)

JAVA=java
CLOSURE=$(JAVA) -jar closure-compiler-v20151216.jar
se_closure_level = ADVANCED
se_closure_warnings = VERBOSE
se_closure_args = \
	--language_in ECMASCRIPT6_STRICT \
	--language_out ECMASCRIPT5_STRICT \
	--create_source_map build/SingularityExplorer.js.map \
	--compilation_level $(se_closure_level) \
	--warning_level $(se_closure_warnings) \
	--source_map_format V3 \
	--source_map_location_mapping "build/|" \
	--source_map_location_mapping "|../" \
	--output_wrapper_file SingularityExplorer.js.wrapper \
	--summary_detail_level 3 \
	--js_output_file $@ \
	$(se_extra_args) \
	--js $(se_srcs)
se_dbg_args = --formatting PRETTY_PRINT

build/SingularityExplorer.js: compiler.jar $(se_srcs)
	mkdir -p $(@D)
	$(CLOSURE) $(se_closure_args)

compiler.jar:
	wget http://dl.google.com/closure-compiler/compiler-latest.zip
	unzip compiler-latest.zip compiler.jar
	rm compiler-latest.zip

SingularityExplorer: build/SingularityExplorer.js

SingularityExplorer-dbg:
	$(RM) build/SingularityExplorer.js
	$(MAKE) se_extra_args='$(se_dbg_args)' build/SingularityExplorer.js

.PHONY: SingularityExplorer
