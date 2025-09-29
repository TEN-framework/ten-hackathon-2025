//
//  Agora SDK
//
//  Copyright (c) 2021 Agora.io. All rights reserved.
//

#pragma once

#include <string>

#include "NGIAgoraExtensionProvider.h"
#include "NGIAgoraExtensionScreenSource.h"
#include "api2/internal/AgoraRefCountedObjectInternal.h"

namespace agora {
namespace rtc {

class ExtProviderDeleter
{
  public:
  template<typename T>
  void operator()(const T* p) const {
    /*
    * We can't use std::default_delete here because RefCountInterface::Release is marked as const member function!!!
    */
    delete p;
  }
};

template<typename T>
using ExtRefCountedObject = agora::RefCountedObject<T, ExtProviderDeleter>;

class ICustomExtensionProvider : public IExtensionProvider {
 public:
  virtual void* createCustomExtension(const char* name) = 0;
  virtual void destroyCustomExtension(const char* name, void* object) = 0;
  virtual agora_refptr<ILipSyncFilter> createLipSyncFilter(const char* name) {
      return NULL;
    }
};

#define RESERVED_INTERNAL_MAJOR_VERSION 999

template <>
struct ExtensionInterfaceVersion<ICustomExtensionProvider> {
  static ExtensionVersion Version() {
    return ExtensionVersion(RESERVED_INTERNAL_MAJOR_VERSION, 0, 0);
  }
};

template <class ExtInterface>
class CustomExtensionWrapper {
 public:
  CustomExtensionWrapper(ICustomExtensionProvider* provider,
                         const char* extension, bool refcounted)
    : provider_(provider), ext_name_(extension) {
    assert(provider_ && !ext_name_.empty());
    if (refcounted) {
      ref_ptr_ = static_cast<RefCountedObject<ExtInterface>*>(
          provider_->createCustomExtension(extension));
    } else {
      raw_ptr_ = static_cast<ExtInterface*>(provider_->createCustomExtension(extension));
    }
  }

  ~CustomExtensionWrapper() {
    if (raw_ptr_) {
      assert(provider_ && !ext_name_.empty());
      provider_->destroyCustomExtension(ext_name_.c_str(), raw_ptr_);
    }
  }

  CustomExtensionWrapper(const CustomExtensionWrapper&) = default;
  CustomExtensionWrapper& operator=(const CustomExtensionWrapper&) = default;
  CustomExtensionWrapper(CustomExtensionWrapper&&) = default;
  CustomExtensionWrapper& operator=(CustomExtensionWrapper&&) = default;

  ExtInterface* get() {
    return raw_ptr_? raw_ptr_ : ref_ptr_.get();
  }

  agora_refptr<ExtInterface> getRefPtr() {
    return ref_ptr_;
  }

 private:
  std::string ext_name_;
  ICustomExtensionProvider* provider_ = nullptr;
  agora_refptr<ExtInterface> ref_ptr_ = nullptr;
  ExtInterface* raw_ptr_ = nullptr;
};

}  // namespace rtc
}  // namespace agora
