package com.realestate.backend.mapper;

import com.realestate.backend.dto.PropertyDetailDTO;
import com.realestate.backend.dto.PropertyListDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PropertyMapper {

    PropertyMapper INSTANCE = Mappers.getMapper(PropertyMapper.class);

    @Mapping(source = "agent.id", target = "agentId")
    @Mapping(source = "agent.name", target = "agentName")
    @Mapping(source = "listedDate", target = "createdAt")
    @Mapping(source = "listedDate", target = "listedDate")
    @Mapping(source = "featured", target = "featured")
    @Mapping(source = "sold", target = "sold")
    @Mapping(source = "active", target = "active")
    @Mapping(source = "soldToUser.name", target = "buyerName")
    @Mapping(source = "agent.verified", target = "isVerified") 
    PropertyListDTO toListDTO(com.realestate.backend.entity.Property property);

    @Mapping(source = "agent.id", target = "agentId")
    @Mapping(source = "agent.name", target = "agentName")
    @Mapping(source = "agent.email", target = "agentEmail")
    @Mapping(source = "agent.phone", target = "agentPhone")
    @Mapping(source = "agent.profilePicture", target = "agentProfilePicture")
    @Mapping(source = "agent.city", target = "agentCity")
    @Mapping(source = "agent.verified", target = "isVerified")
    @Mapping(source = "listedDate", target = "listedDate")
    @Mapping(source = "featured", target = "featured")
    @Mapping(source = "sold", target = "sold")
    PropertyDetailDTO toDetailDTO(com.realestate.backend.entity.Property property);
}
