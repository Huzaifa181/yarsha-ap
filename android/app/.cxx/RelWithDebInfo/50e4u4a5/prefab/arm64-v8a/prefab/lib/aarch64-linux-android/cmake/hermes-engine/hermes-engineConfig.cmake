if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/home/huzaifa/.gradle/caches/8.13/transforms/4a4fe26ca578aed8e2e389e6dd6ea3a8/transformed/hermes-android-0.79.2-release/prefab/modules/libhermes/libs/android.arm64-v8a/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/home/huzaifa/.gradle/caches/8.13/transforms/4a4fe26ca578aed8e2e389e6dd6ea3a8/transformed/hermes-android-0.79.2-release/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

