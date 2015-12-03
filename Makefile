all: SingularityExplorer

clean:
	$(RM) -r build

.PHONY: all clean

se_mods = Misc Quaternion State3D StateGL SingularityExplorer
se_srcs = $(se_mods:%=%.js)

JAVA=java
CLOSURE=$(JAVA) -jar compiler.jar
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
	--js_output_file $@ \
	$(se_extra_args) \
	--js $(se_srcs)
se_dbg_args = --transpile_only --formatting PRETTY_PRINT

build/SingularityExplorer.js: compiler.jar $(se_srcs)
	mkdir -p $(@D)
	$(CLOSURE) $(se_closure_args)

compiler.jar:
	wget http://dl.google.com/closure-compiler/compiler-latest.zip
	unzip compiler-latest.zip compiler.jar
	rm compiler-latest.zip

SingularityExplorer: build/SingularityExplorer.js

SingularityExplorer-dbg:
	$(RM) SingularityExplorer.js
	$(MAKE) se_extra_args='$(se_dbg_args)' build/SingularityExplorer.js

.PHONY: SingularityExplorer
